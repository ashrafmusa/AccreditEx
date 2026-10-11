import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";

export default function LabLogPager({ visible, total, onMore }: { visible: number; total: number; onMore: () => void }) {
    const { t } = useTranslation();
    if (visible >= total) return null;
    return <Button variant="outline" size="sm" onClick={onMore}>{t("labOpsShowOlder")}</Button>;
}
