import { AccreditationProgram, Standard } from "@/types";

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
