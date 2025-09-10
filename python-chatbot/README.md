# Enhanced Chatbot with Attachment Support

This chatbot has been refactored to support attachments along with user queries. Here's how to use the new functionality:

## Features Added

### 1. **Enhanced Chatbot Function**
The `chatbot()` function now accepts:
- `user_input` (str): The user's text query
- `attachments` (List[Dict], optional): List of attachment objects

### 2. **Attachment Support**
Supported attachment types:
- **Text files**: `.py`, `.txt`, `.json`, `.md`, etc.
- **Images**: `.jpg`, `.png`, `.gif`, etc. (for multimodal analysis)
- **Documents**: `.pdf`, `.docx`, etc.

### 3. **API Endpoints**

#### `/api/chat` (POST)
For JSON-based requests with base64-encoded attachments:

```json
{
    "message": "Can you review this code?",
    "attachments": [
        {
            "type": "text",
            "filename": "example.py",
            "content": "base64_encoded_content_here",
            "mime_type": "text/x-python",
            "encoding": "base64"
        }
    ]
}
```

#### `/api/chat/upload` (POST)
For form-data requests with direct file uploads:

```javascript
const formData = new FormData();
formData.append('message', 'Analyze this image');
formData.append('files', fileInput.files[0]);

fetch('/api/chat/upload', {
    method: 'POST',
    body: formData
});
```

#### `/` (GET)
Serves the web interface for testing

## Usage Examples

### 1. **Command Line Usage** (backward compatible)
```python
from chatbot import chatbot

# Without attachments (original functionality)
response = chatbot("What's the weather like?")

# With text attachments
attachments = [{
    'type': 'text',
    'filename': 'code.py',
    'content': 'print("Hello World")',
    'mime_type': 'text/x-python',
    'encoding': 'text'
}]
response = chatbot("Review this code", attachments)
```

### 2. **API Usage**
```bash
# Start the Flask server
python api.py

# Visit http://localhost:4000 for the web interface
# Or use the API endpoints programmatically
```

### 3. **Testing**
```bash
# Run the test script
python test_attachments.py
```

## File Structure
```
python-chatbot/
├── chatbot.py              # Enhanced chatbot with attachment support
├── api.py                  # Flask API with file upload endpoints
├── prompt.poml            # Updated prompt template
├── test_attachments.py    # Test script for new functionality
├── templates/
│   └── index.html         # Web interface for testing
├── requirements.txt       # Dependencies
└── README.md             # This file
```

## Key Improvements

1. **Backward Compatibility**: Existing code continues to work without changes
2. **Type Hints**: Added proper type annotations for better code clarity
3. **Error Handling**: Robust error handling for file processing
4. **Multiple Formats**: Support for various file types and encodings
5. **Web Interface**: Easy-to-use web interface for testing
6. **Multimodal Support**: Image analysis capabilities with Gemini
7. **Attachment Context**: Attachments are properly contextualized in responses

## Dependencies
Make sure to install the required packages:
```bash
pip install -r requirements.txt
```

## Environment Setup
Create a `.env` file with your Google API key:
```
GOOGLE_API_KEY=your_google_api_key_here
```

The chatbot now provides much richer interactions by understanding and analyzing uploaded files alongside text queries!
