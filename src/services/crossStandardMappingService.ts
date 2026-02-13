import { AccreditationProgram, AppDocument, Standard } from "@/types";

export interface CrossStandardControlMember {
    programId: string;
    programName: string;
    standardId: string;
    section: string;
    description: string;
}

export interface CrossStandardControlGroup {
    controlKey: string;
    section: string;
    keyTerms: string[];
    members: CrossStandardControlMember[];
    programsCovered: number;
}

export interface CrossStandardMappingSummary {
    totalStandardsInProgram: number;
    mappedStandardsCount: number;
    mappingCoveragePercent: number;
    reusableControlGroupsCount: number;
    topReusableControlGroups: CrossStandardControlGroup[];
}

export interface ReusableEvidenceSuggestion {
    documentId: string;
    documentName: string;
    matchScore: number;
    matchedStandardIds: string[];
    rationale: string[];
}

const STOP_WORDS = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "must",
    "shall",
    "have",
    "has",
    "are",
    "is",
    "of",
    "to",
    "in",
    "on",
    "by",
    "or",
    "an",
    "a",
    "be",
]);

const normalize = (value?: string): string =>
    (value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const extractKeyTerms = (text: string, maxTerms = 4): string[] => {
    const counts = new Map<string, number>();
    normalize(text)
        .split(" ")
        .filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
        .forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, maxTerms)
        .map(([token]) => token);
};

const buildSectionKey = (section?: string): string => {
    const normalized = normalize(section);
    return normalized || "unclassified";
};

const buildControlKey = (standard: Standard): { key: string; section: string; keyTerms: string[] } => {
    const section = buildSectionKey(standard.section);
    const keyTerms = extractKeyTerms(standard.description || "", 3);
    const signature = keyTerms.length > 0 ? keyTerms.join("|") : "general";
    return {
        key: `${section}::${signature}`,
        section,
        keyTerms,
    };
};

const hasCrossProgramCoverage = (
    members: CrossStandardControlMember[],
    currentProgramId: string,
): boolean => {
    const programSet = new Set(members.map((member) => member.programId));
    return programSet.has(currentProgramId) && programSet.size > 1;
};

export const getRelatedCrosswalkStandards = (
    standardId: string,
    currentProgramId: string,
    standards: Standard[],
): Standard[] => {
    const source = standards.find(
        (standard) =>
            standard.standardId === standardId &&
            standard.programId === currentProgramId,
    );

    if (!source) {
        return [];
    }

    const sourceControlKey = buildControlKey(source).key;

    return standards.filter((standard) => {
        if (standard.programId === currentProgramId) {
            return false;
        }

        return buildControlKey(standard).key === sourceControlKey;
    });
};

const toLowerText = (value: unknown): string =>
    typeof value === "string" ? value.toLowerCase() : "";

const tokenize = (value: string): string[] =>
    normalize(value)
        .split(" ")
        .filter((token) => token.length >= 4);

export const suggestReusableEvidenceForChecklistItem = (params: {
    standardId: string;
    checklistText: string;
    currentProgramId: string;
    standards: Standard[];
    documents: AppDocument[];
    existingEvidenceIds?: string[];
    maxSuggestions?: number;
}): ReusableEvidenceSuggestion[] => {
    const {
        standardId,
        checklistText,
        currentProgramId,
        standards,
        documents,
        existingEvidenceIds = [],
        maxSuggestions = 5,
    } = params;

    const existing = new Set(existingEvidenceIds);
    const relatedStandards = getRelatedCrosswalkStandards(
        standardId,
        currentProgramId,
        standards,
    );
    const relatedStandardIds = new Set(
        [standardId, ...relatedStandards.map((standard) => standard.standardId)]
            .map((id) => id.toLowerCase()),
    );
    const relatedTerms = new Set([
        ...tokenize(checklistText),
        ...relatedStandards.flatMap((standard) => tokenize(standard.description || "")),
    ]);

    const suggestions = documents
        .filter((doc) => doc.isControlled && !existing.has(doc.id))
        .map((doc) => {
            let score = 0;
            const rationale: string[] = [];
            const matchedStandardIds = new Set<string>();

            const tags = (doc.tags || []).map((tag) => tag.toLowerCase());
            const nameText = `${toLowerText(doc.name?.en)} ${toLowerText(doc.name?.ar)}`;
            const categoryText = toLowerText(doc.category);

            tags.forEach((tag) => {
                if (relatedStandardIds.has(tag)) {
                    score += 4;
                    matchedStandardIds.add(tag.toUpperCase());
                    rationale.push(`Tag match: ${tag}`);
                }
            });

            relatedStandardIds.forEach((relatedId) => {
                if (nameText.includes(relatedId) || categoryText.includes(relatedId)) {
                    score += 3;
                    matchedStandardIds.add(relatedId.toUpperCase());
                    rationale.push(`Reference match: ${relatedId}`);
                }
            });

            relatedTerms.forEach((term) => {
                const inTag = tags.some((tag) => tag.includes(term));
                const inName = nameText.includes(term);
                if (inTag || inName) {
                    score += 1;
                }
            });

            if (score === 0) {
                return null;
            }

            return {
                documentId: doc.id,
                documentName: doc.name?.en || doc.name?.ar || doc.id,
                matchScore: score,
                matchedStandardIds: [...matchedStandardIds],
                rationale: [...new Set(rationale)].slice(0, 3),
            } as ReusableEvidenceSuggestion;
        })
        .filter((item): item is ReusableEvidenceSuggestion => Boolean(item))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, maxSuggestions);

    return suggestions;
};

export const buildCrossStandardMappingSummary = (
    currentProgramId: string,
    standards: Standard[],
    programs: AccreditationProgram[],
): CrossStandardMappingSummary => {
    const programNameMap = new Map(programs.map((program) => [program.id, program.name]));
    const controlGroups = new Map<string, CrossStandardControlGroup>();

    standards.forEach((standard) => {
        const { key, section, keyTerms } = buildControlKey(standard);
        const existing = controlGroups.get(key);
        const member: CrossStandardControlMember = {
            programId: standard.programId,
            programName: programNameMap.get(standard.programId) || standard.programId,
            standardId: standard.standardId,
            section: standard.section,
            description: standard.description,
        };

        if (!existing) {
            controlGroups.set(key, {
                controlKey: key,
                section,
                keyTerms,
                members: [member],
                programsCovered: 1,
            });
            return;
        }

        existing.members.push(member);
        existing.programsCovered = new Set(existing.members.map((item) => item.programId)).size;
    });

    const totalStandardsInProgram = standards.filter(
        (standard) => standard.programId === currentProgramId,
    ).length;

    const crossProgramGroups = [...controlGroups.values()].filter((group) =>
        hasCrossProgramCoverage(group.members, currentProgramId),
    );

    const mappedStandards = new Set<string>();
    crossProgramGroups.forEach((group) => {
        group.members
            .filter((member) => member.programId === currentProgramId)
            .forEach((member) => mappedStandards.add(member.standardId));
    });

    const mappedStandardsCount = mappedStandards.size;
    const mappingCoveragePercent =
        totalStandardsInProgram > 0
            ? Math.round((mappedStandardsCount / totalStandardsInProgram) * 100)
            : 0;

    const topReusableControlGroups = crossProgramGroups
        .sort((a, b) => b.programsCovered - a.programsCovered || b.members.length - a.members.length)
        .slice(0, 6);

    return {
        totalStandardsInProgram,
        mappedStandardsCount,
        mappingCoveragePercent,
        reusableControlGroupsCount: crossProgramGroups.length,
        topReusableControlGroups,
    };
};
