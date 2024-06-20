# CSV Data Visualization Platform

**Transform your raw CSV data into insightful and interactive visualizations with ease.**

This application provides a powerful and intuitive platform for users to upload CSV files and generate a wide array of dynamic charts, apply sophisticated data filters, and perform advanced analytical tasks, including specialized orderflow analysis. Designed for both data enthusiasts and professionals, it empowers you to uncover hidden patterns and make data-driven decisions.

## Table of Contents

-   [Introduction](#introduction)
-   [Key Features](#key-features)
-   [Technologies Used](#technologies-used)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
    -   [Running the Application](#running-the-application)
-   [Usage Guide](#usage-guide)
-   [License](#license)

## Introduction

The CSV Data Visualization Platform is a robust web application built to simplify the process of data exploration and visualization. By leveraging modern web technologies, it offers a seamless experience for transforming complex datasets into clear, actionable visual insights. Whether you're analyzing financial data, scientific experiments, or business metrics, this tool provides the flexibility and power you need.

## Key Features

Our platform is packed with features designed to give you comprehensive control over your data visualization:

*   **Diverse Charting Options**:
    *   **Standard Charts**: Generate classic Bar, Line, Pie, Scatter, and Heatmap charts for general data representation.
    *   **Specialized Charts**: Dive deeper with advanced Footprint charts and professional Orderflow charts, including Delta and Volume Heatmap visualizations, tailored for market analysis.
*   **Advanced Data Processing**:
    *   **Intelligent Parsing**: Efficiently parse CSV files, with optimized handling for large datasets (up to 50MB+).
    *   **Data Normalization**: Apply normalization to your numeric data for consistent scaling and comparison across different metrics.
    *   **Dynamic Filtering**: Implement precise data filters based on numeric column values and operators (greater, less, equal, etc.) to focus on specific data subsets.
*   **Interactive & Responsive Interface**:
    *   **Intuitive Controls**: Easily configure chart types, axis selections, titles, and other parameters through a user-friendly interface.
    *   **Zoom & Pan**: Explore granular details of your charts with interactive zoom and pan functionalities.
    *   **Brush Selection**: Select specific data ranges for focused analysis using the integrated brush tool.
    *   **Real-time Updates**: See your visualizations update instantly as you modify data or chart settings.
*   **Multi-Chart Combinations**:
    *   **Composite Views**: Create sophisticated dashboards by combining multiple chart types (e.g., bars and lines) on a single canvas, allowing for layered data analysis.
    *   **Dual Y-Axes**: Assign different data series to left and right Y-axes for effective comparison of disparate metrics.
*   **Customizable User Experience**:
    *   **Theme Selection**: Personalize your workspace with Light, Dark, and Accent themes to suit your preference and reduce eye strain.
    *   **Export Capabilities**: Easily export your generated charts as images for reports, presentations, or sharing.

## Technologies Used

This project is built using a modern and robust stack to ensure performance, scalability, and a rich user experience:

*   **Frontend Framework**: `React` - A declarative, component-based JavaScript library for building user interfaces.
*   **Build Tool & Dev Server**: `Vite` - A fast and opinionated build tool that provides an extremely quick development experience.
*   **Styling**: `Tailwind CSS` - A utility-first CSS framework for rapidly building custom designs.
*   **Charting Library**: `Recharts` - A composable charting library built on React components, offering flexible and powerful data visualization.
*   **CSV Parsing**: `PapaParse` - A powerful in-browser CSV parser for handling large CSV files efficiently.
*   **Iconography**: `Lucide React` - A collection of beautiful and customizable open-source icons.
*   **Data Manipulation**: `d3-scale` - A D3 module for creating continuous, ordinal, and quantitative scales.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Node.js**: Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
*   **npm** (Node Package Manager): Comes bundled with Node.js.

### Installation

1.  **Clone the repository**:
    If you have Git installed, open your terminal or command prompt and run:
    ```bash
    git clone <repository_url>
    cd csv-data-visualization-platform
    ```
    (Replace `<repository_url>` with the actual URL of your project's repository.)

    If you downloaded the project as a ZIP file, extract it to your desired directory and navigate into the project folder.

2.  **Install dependencies**:
    Once inside the project directory, install the necessary Node.js packages:
    ```bash
    npm install
    ```

### Running the Application

To start the development server and view the application in your browser:

```bash
npm run dev
```

This command will compile the project and typically open it in your default web browser at `http://localhost:5173`. The application will automatically reload as you make changes to the source code.

## Usage Guide

1.  **Upload Your Data**:
    *   Upon launching the application, you'll be greeted with a file upload interface.
    *   Click the "Choose File" button or simply drag and drop your `.csv` file into the designated area.
    *   The platform will automatically parse your data and detect column types (numeric or categorical).

2.  **Configure Charts**:
    *   After a successful upload, an initial chart will be automatically generated based on your data.
    *   Use the "Add Chart", "Add Combo", or "Orderflow" buttons to introduce new visualization panels.
    *   Each chart panel comes with its own set of controls:
        *   **Chart Type**: Select from Bar, Line, Pie, Scatter, Heatmap, Footprint, Delta Orderflow, or Volume Heatmap.
        *   **Axis Selection**: Choose appropriate columns for your X and Y axes. For combo charts, you can select multiple Y-axis columns.
        *   **Normalization**: Toggle data normalization for Y-axis values to scale them between 0 and 1.
        *   **Title**: Customize the title for each chart.
        *   **Size**: Adjust the width and height of individual charts.
        *   **Axis Order**: Control the sorting order of data points along the X and Y axes.
    *   **Combination Charts**: For "Combo Charts", you can individually configure each series (column) within the chart, including its type (bar, line, area, scatter), Y-axis assignment (left/right), color, stroke width, opacity, and visibility.

3.  **Apply Data Filters**:
    *   In the "Data Overview" section, use the "Data Filters" component to refine your dataset.
    *   Add new filters, select a numeric column, choose an operator (e.g., `greater`, `less`, `equal`), and specify a value.
    *   Filters are applied in real-time, updating all active charts.

4.  **Interact with Visualizations**:
    *   **Zoom & Pan**: Click and drag on the chart area to pan, and use your mouse wheel or dedicated zoom buttons to zoom in/out.
    *   **Brush**: For charts with a brush component, drag the selection area to focus on a specific data range.
    *   **Tooltips**: Hover over data points to view detailed information in interactive tooltips.
    *   **Toggle Elements**: Use the control buttons above each chart to toggle grid lines, data points, area fills, and more.
    *   **Export**: Click the "Export Chart" button to download the current chart as a PNG image.

5.  **Manage Charts**:
    *   Add multiple charts to compare different aspects of your data side-by-side.
    *   Remove individual charts if they are no longer needed.
    *   Collapse chart controls to save screen space.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.