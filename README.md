<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">


# DJANGO-INDUSTRIAL-ANALYTICS

<em>Transform Data into Actionable Industrial Insights</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/last-commit/Manu-Kem/django-industrial-analytics?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/Manu-Kem/django-industrial-analytics?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/Manu-Kem/django-industrial-analytics?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/Typer-000000.svg?style=flat&logo=Typer&logoColor=white" alt="Typer">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/Autoprefixer-DD3735.svg?style=flat&logo=Autoprefixer&logoColor=white" alt="Autoprefixer">
<img src="https://img.shields.io/badge/PostCSS-DD3A0A.svg?style=flat&logo=PostCSS&logoColor=white" alt="PostCSS">
<img src="https://img.shields.io/badge/scikitlearn-F7931E.svg?style=flat&logo=scikit-learn&logoColor=white" alt="scikitlearn">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/Rich-FAE742.svg?style=flat&logo=Rich&logoColor=black" alt="Rich">
<img src="https://img.shields.io/badge/FastAPI-009688.svg?style=flat&logo=FastAPI&logoColor=white" alt="FastAPI">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/NumPy-013243.svg?style=flat&logo=NumPy&logoColor=white" alt="NumPy">
<br>
<img src="https://img.shields.io/badge/Pytest-0A9EDC.svg?style=flat&logo=Pytest&logoColor=white" alt="Pytest">
<img src="https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/Zod-3E67B1.svg?style=flat&logo=Zod&logoColor=white" alt="Zod">
<img src="https://img.shields.io/badge/SciPy-8CAAE6.svg?style=flat&logo=SciPy&logoColor=white" alt="SciPy">
<img src="https://img.shields.io/badge/Plotly-3F4F75.svg?style=flat&logo=Plotly&logoColor=white" alt="Plotly">
<img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" alt="ESLint">
<img src="https://img.shields.io/badge/pandas-150458.svg?style=flat&logo=pandas&logoColor=white" alt="pandas">
<img src="https://img.shields.io/badge/Axios-5A29E4.svg?style=flat&logo=Axios&logoColor=white" alt="Axios">
<img src="https://img.shields.io/badge/datefns-770C56.svg?style=flat&logo=date-fns&logoColor=white" alt="datefns">
<img src="https://img.shields.io/badge/React%20Hook%20Form-EC5990.svg?style=flat&logo=React-Hook-Form&logoColor=white" alt="React%20Hook%20Form">
<img src="https://img.shields.io/badge/Pydantic-E92063.svg?style=flat&logo=Pydantic&logoColor=white" alt="Pydantic">
<img src="https://img.shields.io/badge/Chart.js-FF6384.svg?style=flat&logo=chartdotjs&logoColor=white" alt="Chart.js">

</div>
<br>

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Testing](#testing)
- [Features](#features)
- [Project Structure](#project-structure)

---

## Overview

Django-Industrial-Analytics is a full-stack platform designed to empower industrial data analysis with robust backend services and a modern, component-driven frontend. It streamlines deployment, enhances system reliability, and supports advanced analytics and machine learning workflows. The core features include:

- 🧩 **🔧 Modular Architecture:** Seamlessly integrates data import/export, analytics, and ML models within a scalable system.
- 🌐 **🔒 Secure API:** Built with FastAPI, JWT authentication, and MongoDB, ensuring secure and reliable data handling.
- 🎨 **🎯 Rich UI Components:** Extensive React-based UI library with Tailwind CSS and Radix UI for a consistent, accessible user experience.
- 🧪 **🛠️ Comprehensive Testing:** Rigorous API and system tests to maintain stability and performance.
- 🚀 **⚙️ Developer-Friendly:** Simplifies onboarding with clear setup instructions and reusable code components.

---

## Features

|      | Component       | Details                                                                                     |
| :--- | :-------------- | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**  | <ul><li>Monolithic Django backend with REST API endpoints</li><li>React-based frontend with Next.js</li><li>Separation of frontend and backend via API calls</li></ul> |
| 🔩 | **Code Quality**  | <ul><li>Uses PEP8 standards, enforced via flake8</li><li>Type hints with Pydantic and mypy</li><li>Code linting and formatting scripts included</li></ul> |
| 📄 | **Documentation** | <ul><li>Comprehensive README with setup instructions</li><li>API documentation generated via Swagger/OpenAPI</li><li>Frontend component documentation via Storybook</li></ul> |
| 🔌 | **Integrations**  | <ul><li>Machine learning models loaded with joblib (`oee_model.joblib`, `efficiency_model.joblib`)</li><li>External APIs via `requests` and `axios`</li><li>Cloud storage via boto3 for AWS S3</li></ul> |
| 🧩 | **Modularity**    | <ul><li>Backend organized into Django apps (e.g., analytics, models)</li><li>Frontend components modularized with React components and Radix UI primitives</li><li>Use of utility modules for common functions</li></ul> |
| 🧪 | **Testing**       | <ul><li>Backend tests with pytest, including model and API tests</li><li>Frontend tests with Jest and React Testing Library</li><li>CI/CD pipelines run tests automatically</li></ul> |
| ⚡️  | **Performance**   | <ul><li>Model inference optimized with joblib caching</li><li>Frontend uses React.memo and lazy loading for components</li><li>Efficient data visualization with Chart.js and Recharts</li></ul> |
| 🛡️ | **Security**      | <ul><li>JWT authentication via PyJWT and OAuthlib</li><li>Secure API endpoints with DRF permissions</li><li>Input validation with Pydantic and Zod</li></ul> |
| 📦 | **Dependencies**  | <ul><li>Backend dependencies managed via `requirements.txt` (Django, FastAPI, scikit-learn, pandas, etc.)</li><li>Frontend dependencies via `package.json` (React, TailwindCSS, Radix UI, Chart.js, etc.)</li></ul> |

---

## Project Structure

```sh
└── django-industrial-analytics/
    ├── README.md
    ├── backend
    │   ├── ml_models
    │   ├── requirements.txt
    │   └── server.py
    ├── backend_test.py
    ├── frontend
    │   ├── .gitignore
    │   ├── README.md
    │   ├── components.json
    │   ├── craco.config.js
    │   ├── jsconfig.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── public
    │   ├── src
    │   └── tailwind.config.js
    ├── test_reports
    │   └── iteration_1.json
    └── test_result.md
```

---

## Getting Started

### Prerequisites

This project requires the following dependencies:

- **Programming Language:** JavaScript, Python
- **Package Manager:** Npm, Pip

### Installation

Build django-industrial-analytics from the source and install dependencies:

1. **Clone the repository:**

    ```sh
    ❯ git clone https://github.com/Manu-Kem/django-industrial-analytics
    ```

2. **Navigate to the project directory:**

    ```sh
    ❯ cd django-industrial-analytics
    ```

3. **Install the dependencies:**

**Using [npm](https://www.npmjs.com/):**

```sh
❯ npm install
```
**Using [pip](https://pypi.org/project/pip/):**

```sh
❯ pip install -r backend/requirements.txt
```

### Usage

Run the project with:

**Using [npm](https://www.npmjs.com/):**

```sh
npm start
```
**Using [pip](https://pypi.org/project/pip/):**

```sh
python {entrypoint}
```

### Testing

Django-industrial-analytics uses the {__test_framework__} test framework. Run the test suite with:

**Using [npm](https://www.npmjs.com/):**

```sh
npm test
```
**Using [pip](https://pypi.org/project/pip/):**

```sh
pytest
```

---

<div align="left"><a href="#top">⬆ Return</a></div>

---
