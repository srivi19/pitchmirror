# PitchMirror Architecture

This document outlines the architecture of the PitchMirror application.

## Component Structure

The application is built as a single-page application (SPA) using React. The main component is `PitchMirror`, which manages the application's state and renders the different views based on the current phase.

- **`PitchMirror`**: The main component that manages the application's state and renders the different views.
- **`ScoreRing`**: A component that displays a score as a circular progress ring.
- **`TypingIndicator`**: A component that displays a typing animation.

## State Management

The application's state is managed using the `useState` and `useRef` hooks from React. The main state variables are:

- **`phase`**: The current phase of the application (e.g., `landing`, `recording`, `analyzing`, `report`, `pickInvestor`, `simulation`, `final`).
- **`pitchText`**: The text of the user's pitch.
- **`analysis`**: The analysis of the user's pitch.
- **`simMessages`**: The messages in the investor simulation.
- **`finalReport`**: The final report of the investor simulation.

## API Communication

The application communicates with the Anthropic API to analyze the user's pitch and to simulate the investor Q&A session. The `fetch` API is used to make requests to the API.
