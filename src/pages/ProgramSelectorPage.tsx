import ProgramSelectorWizard from "@/components/onboarding/ProgramSelectorWizard";
import { useUserStore } from "@/stores/useUserStore";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProgramSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Redirect to dashboard if program already selected
    if (currentUser.profile?.accreditationProgram) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleComplete = () => {
    navigate("/dashboard");
  };

  return <ProgramSelectorWizard onComplete={handleComplete} />;
};

export default ProgramSelectorPage;
