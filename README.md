# AccreditEx - Healthcare Accreditation Management

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Code Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

AccreditEx is a modern, AI-powered desktop application designed to support healthcare institutions throughout their accreditation journey. By providing a centralized, intuitive platform with a **live Firebase and Firestore backend**, it streamlines the management of accreditation programs (like JCI, DNV, and OSAHI), ensures traceability of all actions, and helps maintain a high level of compliance across the entire organization.

## Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architectural Approach](#architectural-approach)
- [Project Structure](#project-structure)
- [Backend & Data Persistence](#backend--data-persistence)
- [AI Integration](#ai-integration)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

The application is designed to run without a build step.

1.  **Configure Firebase**: Open `firebase/firebaseConfig.ts` and replace the placeholder configuration with your own Firebase project's credentials.
2.  **Set up Firebase**: In your Firebase project console, enable "Email/Password" authentication and create a Firestore database.
3.  **Run the Application**: Open the `index.html` file in your browser.
4.  The application will initialize. If it's the first time connecting to your database, it will seed it with the initial data.

**Demo Credentials:**
-   **Email**: `e.reed@healthcare.com`
-   **Password**: `password123`

## Features

-   **Training & Competency Management**:
    -   **Training Hub**: A full-featured module with interactive content, quizzes, and automated certificate generation.
    -   **User Profile & Competency Hub**: A detailed "digital HR file" for each staff member, tracking their job title, hire date, project involvement, training history, and a full list of their professional competencies and certifications with issue/expiry date tracking.
-   **Departmental Management**: Organize users into departments, view detailed performance dashboards, and assign tasks effectively.
-   **Bilingual & RTL Support**: Full support for English and Arabic, including a right-to-left (RTL) interface.
-   **Light & Dark Mode**: A comfortable viewing experience in any lighting condition.

## Technology Stack

-   **Frontend**: React 18, TypeScript, Tailwind CSS (via CDN)
-   **Backend**: Google Firebase
    -   **Authentication**: Firebase Authentication (Email/Password)
    -   **Database**: Google Firestore
-   **State Management**: Zustand
-   **Charting**: Recharts
-   **AI Integration**: Google Gemini API (`@google/genai`)
-   **Build System**: None (utilizes modern browser features like `importmap`)

## Architectural Approach

AccreditEx is built on a clean, scalable, and modular architecture to ensure long-term maintainability.

1.  **Frontend (React Application)**: Handles all UI, user interactions, and data presentation. It is composed of page components, reusable UI components, and domain-specific components. The application uses a custom client-side router (`MainRouter.tsx`) driven by a navigation state object.

2.  **State Management (Zustand)**: Global state is managed through feature-based stores (`useAppStore`, `useProjectStore`, `useUserStore`). These stores are the primary way the UI interacts with the `BackendService` to fetch and manipulate data, providing a clean, reactive state management solution.

3.  **Service Layer (`BackendService.ts`)**: The single source of truth for all application data and business logic. It encapsulates all database operations, interactions with the Gemini API, and core application logic. The frontend interacts exclusively with this service via `async` methods, keeping the UI decoupled from data management.

4.  **Backend Layer (Firebase/Firestore)**: The application uses a live Firebase backend for authentication and Firestore for its database. All data is persisted in the cloud.

5.  **AI Layer (`ai.ts`)**: This service isolates all interactions with the Google Gemini API, providing a clean interface for AI-powered features throughout the application.

## Project Structure

The project is organized into a logical and scalable structure that separates concerns.

```
/
├── components/           # Reusable React components, organized by feature
├── data/                 # Static data, including localization and initial DB seed files
│   ├── locales/          # Modularized translation files (i18n)
│   ├── *.json            # JSON files used to seed Firestore on first launch
├── firebase/             # Firebase configuration and custom hooks
├── hooks/                # Custom React hooks
├── pages/                # Top-level components for each view/page of the application
├── services/             # Core application logic and external API communication
│   ├── ai.ts             # Handles all communication with the Google Gemini API
│   ├── BackendService.ts # Central service layer, talks to Firebase/Firestore
├── stores/               # Zustand state management stores
├── App.tsx               # Main application component, handles providers and initialization
├── index.html            # The single HTML entry point
└── types.ts              # Centralized TypeScript types and interfaces
```

## Backend & Data Persistence

The application uses Google Firebase for authentication and Google Firestore for its database, ensuring all data is persisted in the cloud and updated in real-time.

### Initialization and Seeding

-   The `services/BackendService.ts` service manages all data operations.
-   On the application's first launch, the service checks for a metadata flag in Firestore.
-   If the flag is not present, it populates the Firestore database by writing the initial data from the JSON files located in the `/data` directory (e.g., `projects.json`, `users.json`).
-   On subsequent launches, the service loads all data directly from Firestore.

### Resetting the Database

To reset the application to its initial seed state, you must manually clear the data in your Firebase project's Firestore console.
1.  Navigate to your project in the Firebase Console.
2.  Go to the "Firestore Database" section.
3.  Delete all collections (e.g., `projects`, `users`, `_metadata`, etc.).
4.  Refresh the AccreditEx application in your browser. It will detect the empty database and re-seed it with the initial data.

## AI Integration

AI-powered features are provided by the Google Gemini API.

-   All API calls are centralized in `services/ai.ts`.
-   The application requires a valid Google Gemini API key to be available in the execution environment.
-   **API Key Configuration**: The API key **must** be available as `process.env.API_KEY`. The application is designed to use this key automatically without any user input.

## Contributing

We welcome contributions to this project. To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your changes and commit them to your branch.
4. Push your changes to your fork.
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.