import React from 'react';
import { User, Department, Project, TrainingProgram, UserTrainingStatus, Competency, AppDocument, NavigationState } from '../types';
import UserProfileHeader from '../components/users/UserProfileHeader';
import UserCompetencies from '../components/users/UserCompetencies';
import UserTrainingDashboard from '../components/users/UserTrainingDashboard';
import UserProjectInvolvement from '../components/users/UserProjectInvolvement';

interface UserProfilePageProps {
    user: User;
    currentUser: User;
    department?: Department;
    projects: Project[];
    trainingPrograms: TrainingProgram[];
    userTrainingStatus: UserTrainingStatus;
    competencies: Competency[];
    documents: AppDocument[];
    onUpdateUser: (user: User) => void;
    setNavigation: (state: NavigationState) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = (props) => {
    return (
        <div className="space-y-6">
            <UserProfileHeader 
                user={props.user}
                department={props.department}
            />
            
            <UserCompetencies
                user={props.user}
                currentUser={props.currentUser}
                competencies={props.competencies}
                documents={props.documents}
                onUpdateUser={props.onUpdateUser}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserTrainingDashboard
                    user={props.user}
                    userTrainingStatus={props.userTrainingStatus}
                    trainingPrograms={props.trainingPrograms}
                    setNavigation={props.setNavigation}
                />
                <UserProjectInvolvement 
                    user={props.user}
                    projects={props.projects}
                />
            </div>
        </div>
    );
};

export default UserProfilePage;