# Role

You are a Senior Angular Developer.

# Task

Develop a new Angular Chatbot Application 'Shauna' that integrates with a python API hosted locally to support conversational capabilities. The application should feature a user-friendly interface, and the ability to handle complex queries. Ensure the application is responsive and works seamlessly across different devices. Implement robust error handling and logging mechanisms to monitor API interactions and user activities. Additionally, include unit tests and end-to-end tests to ensure the reliability and performance of the application. Provide comprehensive documentation for the codebase and setup instructions for deployment.

# Task

Project Setup and Configuration

- Initialize a new Angular project using Angular CLI.
- Set up TypeScript and configure tsconfig.json for optimal performance.
- Install necessary dependencies including Angular Material for UI components, HttpClientModule for API interactions, and ngx-translate for multi-language support.
- Configure environment files to securely store API keys and other sensitive information.

# Task

API Wiring and Integration

- Create a service to handle interactions with Chatbot API running in https://localhost:4000/api.
- Implement POST method for sending user queries to the API and receiving responses. This uses route /chat and sends a json { "message": userQuery } in the request
- Implement GET method for checking if the API is healthy. This uses route /healthy and responds back with "healthy" in case of active. Use this to display ChatBot is active or inactive
- Handle API rate limiting , loading message 'Shauna is typing...' and implement retry logic for failed requests.

# Task

User Interface Development

- Design a responsive chat interface using Angular Material components.
- Implement a chat window that displays user messages and bot responses in a conversational format.
- Add input field for user queries with support for multiline text and send button.
- Include features like message timestamps, user avatars, and bot typing indicators.
- Ensure the interface is accessible and follows best practices for UX design.

# Task

State Management

# Task

Voice Command Integration

- Integrate Web Speech API to enable voice input for user queries.
- Implement a microphone button that users can click to start and stop voice recording.
- Convert voice input to text and populate the input field with the transcribed text.
- Handle scenarios where voice recognition fails or is not supported by the browser.
- Provide visual feedback during voice recording, such as a waveform animation or recording indicator.
- Ensure voice commands are processed and sent to the API in the same manner as text input.
- Fetch the response from API and convert it into voice and play it back to the user. ( Use a soft mild voice for this)

# Task

Attchment Support

- Implement file upload functionality to allow users to attach files in the chat.
- Support common file types such as images (JPEG, PNG), documents (PDF, DOCX), and text files (TXT).
- Display uploaded files as clickable links or thumbnails within the chat interface.
- Ensure files are sent to the API as part of the chat message payload. This ensures any queries asked within the document
- Handle file size limits and provide user feedback for unsupported file types.

# Task

Chat DashBoard

- Implement a dashboard to view past 10 chat history with timestamps and user/bot identifiers.
- Allow users to search and filter chat history based on keywords or date ranges.
- Save the past history in Localstorage for quick retrieval
- Use Branding.Json to display the detais about the chatbot Shauna

# Task

Styling:

- Apply consistent styling to the chat interface using CSS and Angular Material theming.
- Ensure the chat interface is responsive and works well on different screen sizes.
- Use animations and transitions to enhance the user experience during interactions.
- Implement dark mode support for better accessibility and user preference.
- Format the response in a user-friendly manner, including support for markdown, links, and images.
- Read aloud the response using web speech API only if the user opts for speech to text input.
- Whenever loading the response, use the Loading music from Branding.json

# Task

Error Handling and Logging

- Implement global error handling to catch and display user-friendly error messages.
- Log API interactions and errors to the console for debugging purposes.
- Use Angular's HttpInterceptor to manage request and response logging.
- Provide fallback mechanisms in case of API failures, such as retrying requests or notifying users of issues.

# Task

Testing

- Write unit tests for services, components, and utility functions using Jasmine and Karma.
- Implement end-to-end tests using Protractor to simulate user interactions with the chat interface.
- Ensure high test coverage and validate that all features work as expected across different scenarios.

# Task

Documentation and Deployment

- Document the codebase with comments and README files explaining setup, usage, and deployment instructions.
- Create a deployment script or guide for hosting the application on a web server or cloud platform.
- Ensure the application is optimized for production with AOT compilation and minification.