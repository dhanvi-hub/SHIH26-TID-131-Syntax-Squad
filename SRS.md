# Software Requirements Specification (SRS)
## AI Fraud Detection Application

### 1. Introduction
#### 1.1 Purpose
This document specifies the software requirements for the AI Fraud Detection Application. It provides a comprehensive overview of the system's features, architecture, and user requirements.

#### 1.2 Scope
The application is a Next.js-based web platform designed to help investigators analyze, track, and detect fraudulent transactions. It provides a dashboard with visual analytics (charts, maps) and detailed transaction investigation capabilities.

#### 1.3 Intended Audience
This document is intended for developers, project managers, QA testers, and stakeholders involved in the development and maintenance of the application.

### 2. Overall Description
#### 2.1 Product Perspective
The system is built as a web application using Next.js (App Router), styled with Tailwind CSS, and utilizes various Radix UI components for accessibility and robust UI. It relies on AI models to score transactions for fraud likelihood and surfaces this information to analysts.

#### 2.2 Product Functions
- **Transaction Monitoring**: View a list of recent transactions with fraud scores and risk indicators.
- **Detailed Investigation**: Deep dive into specific transactions (via `/investigation/[txnId]`) to analyze risk factors and historical data.
- **Visual Analytics**: Interactive charts (`recharts`) and geospatial data visualization (`react-simple-maps`) to spot patterns.
- **Alerts & Notifications**: Alerts for high-risk transactions (`sonner` for toast notifications).

#### 2.3 User Characteristics
Primary users are Fraud Analysts and Investigators who require an intuitive, fast, and data-rich interface to make quick decisions on flagged transactions.

### 3. System Features
#### 3.1 Dashboard
- **Description**: A central hub displaying key metrics, fraud trends, and alerts.
- **Requirements**: Must load quickly, display interactive charts, and provide a geospatial map of transaction origins.

#### 3.2 Transaction Investigation Module
- **Description**: A dedicated view for individual transactions.
- **Requirements**: Must display transaction metadata, user history, AI fraud score explanation, and allow the investigator to mark the transaction as legitimate or fraudulent.

### 4. Non-Functional Requirements
- **Performance**: The application must be highly responsive, providing smooth transitions between dashboard and investigation views.
- **Scalability**: The frontend architecture must support a growing number of UI components and complex data visualizations.
- **Usability**: The UI must follow modern accessibility standards, utilizing Radix UI primitives.
- **Security**: Must handle sensitive financial data securely and authenticate users properly before granting access to investigation details.

### 5. Technology Stack
- **Framework**: Next.js 16.2.0 (React 19)
- **Styling**: Tailwind CSS
- **Components**: Radix UI, Lucide React (Icons)
- **Data Visualization**: Recharts, React Simple Maps
- **Form Handling & Validation**: React Hook Form with Zod validation
