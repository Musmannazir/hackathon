# Medical Patrol – AI-Powered Counterfeit Medicine Detection & Voice Assistant

## 🚀 Project Overview

Medical Patrol is an innovative AI-powered web application designed to combat the critical issue of counterfeit medicines, particularly in underserved regions. It offers a robust solution for authenticity verification and provides accessible medical guidance through a voice-enabled AI chatbot.

## ✨ Features

* **📷 Medicine Authenticity Check:** Users can upload photos of medicine labels for text analysis using **OCR (Optical Character Recognition)**.
* **🤖 AI-Powered Detection:** The extracted text is analyzed by **LLaMA-3 (via Groq)** to identify inconsistencies and indicators of counterfeit origin.
* **📧 Automated Alerts:** If a suspicious medicine is detected, the app automatically sends email alerts to relevant authorities and generates a detailed case report using an autonomous agent.
* **🧠 Voice-Enabled AI Chatbot:** Users can interact with an AI assistant via voice for medicine-related queries.
* **🎤 Seamless Speech Input:** Utilizes **Groq’s Whisper (speech-to-text)** model for instant and accurate transcription.
* **💬 Contextual Conversations:** The chatbot employs **MCP (Model Context Protocol)** to remember previous messages, ensuring personalized and consistent conversations.
* **🌍 Impact-Driven Design:** Built with a focus on accessibility and effectiveness in regions with limited healthcare access, low literacy rates, and high medicine fraud cases.

## 💡 The Problem We're Solving

In many parts of the world, especially in Africa, counterfeit medicines pose a severe public health crisis. Patients unknowingly consume fake drugs, leading to ineffective treatments, worsening conditions, and tragically, even death. There is an urgent, critical need for accessible and low-cost tools to verify medicine authenticity at the community level.

## 🛠️ Technology Stack

Our robust combination of technologies allows us to deliver a powerful and impactful solution:

* **AI/ML:** Core for intelligent detection and conversational capabilities.
* **Healthcare:** Application domain.
* **Social Impact:** Primary mission.
* **Computer Vision:** For OCR and image processing.
* **Speech Recognition:** For voice interaction.
* **Conversational AI:** For the interactive chatbot.
* **MCP (Model Context Protocol):** For maintaining chatbot conversation context.
* **Groq LLaMA-3:** Large Language Model for analysis and responses.
* **Whisper (Groq):** State-of-the-art speech-to-text model.
* **Flask:** Web framework for the application.
* **OCR.space API:** For optical character recognition.
* **Email Automation:** For alerts and reporting.
* **Voice AI:** Overall voice integration.
* **Hack for Africa:** Origin of the project.

## 🚀 Getting Started

To get a local copy of Medical Patrol up and running for development and testing, follow these steps.

### Prerequisites

Before you begin, ensure you have the following installed:

* Python 3.8+
* `pip` (Python package installer)
* A virtual environment tool (e.g., `venv`)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/medical-patrol.git](https://github.com/yourusername/medical-patrol.git)
    cd medical-patrol
    ```
2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # On Windows
    .\venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *(Note: You will need to create a `requirements.txt` file listing all your project's Python dependencies, e.g., Flask, groq, requests, python-dotenv, etc.)*
4.  **Set up Environment Variables:**
    Create a `.env` file in the root of your project and add your API keys and credentials:
    ```dotenv
    GROQ_API_KEY="your_groq_api_key_here"
    OCR_SPACE_API_KEY="your_ocr_space_api_key_here"
    EMAIL_USERNAME="your_email@example.com"
    EMAIL_PASSWORD="your_email_app_password" # Use app password for security
    # Add any other necessary keys/variables
    ```
5.  **Run the application:**
    ```bash
    python app.py
    ```
    *(Assuming your main Flask application file is named `app.py`)*

The application should now be running locally, typically accessible via `http://127.0.0.1:5000/` in your web browser.

## 🤝 Contribution

We welcome contributions to Medical Patrol! If you have ideas for improvements, bug fixes, or new features, please feel free to fork the repository and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the `LICENSE` file for details. 

## 📞 Contact

For any questions or inquiries, please reach out to:

* **[Eman Khaliq/Team Maverick]** - [ekhaliq409@gmail.com]

