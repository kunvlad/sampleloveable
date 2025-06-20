# Product Requirements Document (PRD)

## Project Overview
This project is a laboratory sample management and workflow automation tool built with Vite, React, TypeScript, shadcn-ui, and Tailwind CSS. It is designed to help lab technicians efficiently track, manage, and process samples, as well as automate and reproduce experimental workflows.

---

## Functional Requirements

### 1. Sample Management
- Add, edit, and delete samples with properties such as barcode, name, type, status, volume, weight, and concentration.
- Track sample status through various stages: created, imported, prepared, analyzed, split, merged, transferred.
- Support for parent-child relationships between samples (splitting, merging, transferring).
- Barcode scanning and manual entry for sample creation.
- Prevent duplicate barcodes.

### 2. Volume & Weight Management
- Enter and update sample weight manually or via connected balance.
- Enter and update sample volume manually or via digital pipette simulation.
- Automatic calculation of concentration based on weight and volume.
- Support for batch volume adjustments and group transfers.

### 3. Sample Operations
- Transfer specific volumes between tubes.
- Split samples into aliquots with custom or equal volumes.
- Merge samples with volume and concentration control, including partial merges.
- Maintain and update sample history and relationships.

### 4. HPLC Sequence Generation
- Select samples for HPLC sequence generation.
- Export HPLC sequence as CSV.
- Automatic assignment of positions.

### 5. Sample Search & Filtering
- Search samples by barcode, name, or properties.
- Filter samples by status, date, or concentration.
- Sort and export filtered results.

### 6. Batch Operations
- Perform bulk status updates, volume adjustments, group transfers, and exports.

### 7. Sample Visualization
- Visualize sample history and relationships as an expandable tree and interactive graph.
- Dedicated page for sample relationship graph with zoom and color coding.

### 8. Workflow Management
- Export and import workflows as YAML files.
- Guided workflow reproduction with step-by-step execution and progress tracking.
- Start, continue, or load workflows at session start.

### 9. User Interface
- Responsive, modern UI with shadcn-ui and Tailwind CSS.
- Visual feedback for selection, status, and operations.

---

## User Stories

| #  | User Story |
|----|------------|
| 1  | As a lab technician, I want to add weight measurements to samples so that I can calculate concentrations. |
| 2  | As a lab technician, I want to track sample volumes using a digital pipette simulation so that I can manage sample quantities accurately. |
| 3  | As a lab technician, I want to transfer specific volumes between sample tubes so that I can prepare samples for different analyses. |
| 4  | As a lab technician, I want to split samples into aliquots with different or equal volumes so that I can prepare samples for various tests. |
| 5  | As a lab technician, I want to merge samples with volume and concentration control so that I can create precise mixed samples. |
| 6  | As a lab technician, I want to generate HPLC sequences from selected samples so that I can run automated analyses. |
| 7  | As a lab technician, I want sample selection to be synchronized between tracker and history views so that I can easily manage sample groups. |
| 8  | As a lab technician, I want to see the complete history and relationships of my samples so that I can track sample lineage. |
| 9  | As a lab technician, I want to scan barcodes to quickly add samples so that I can efficiently track new samples. |
| 10 | As a lab technician, I want to search and filter samples by various criteria so that I can quickly find specific samples. |
| 11 | As a lab technician, I want to perform batch operations on multiple samples so that I can efficiently manage large sample sets. |
| 12 | As a lab technician, I want to add volume from a source sample with automatic concentration calculations so that I can work with pre-liquids and dilutions. |
| 13 | As a lab technician, I want to save and load workflows as YAML files so that I can reproduce experimental procedures. |
| 14 | As a lab technician, I want workflow management options at the beginning of my session so that I can easily start, continue, or load workflows. |
| 15 | As a lab technician, I want to reproduce loaded workflows through a guided interface so that I can follow experimental procedures step by step. |
| 16 | As a lab technician, I want a dedicated page for sample relationship visualization with zoom capabilities so that I can better understand sample dependencies. |

---

## Non-Functional Requirements
- The application must be responsive and work on desktop and tablet devices.
- All data operations should be fast and provide immediate feedback to the user.
- The system should prevent data loss and handle errors gracefully.
- The UI should be modern, accessible, and easy to use.

---

## Technologies Used
- Vite
- React
- TypeScript
- shadcn-ui
- Tailwind CSS

---

## Future Enhancements
- Advanced search and filtering options.
- Integration with external LIMS systems.
- More granular user roles and permissions.
- Enhanced reporting and analytics.

---

*This document summarizes the requirements and user stories based on the current codebase and user stories defined in the project.*
