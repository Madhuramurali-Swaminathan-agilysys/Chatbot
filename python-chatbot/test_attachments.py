"""
Test script to demonstrate the enhanced chatbot functionality with attachments
"""
import json
import base64
from chatbot import chatbot

def test_text_attachment():
    """Test chatbot with a text attachment"""
    print("Testing chatbot with text attachment...")
    
    # Sample text content
    text_content = """
    def hello_world():
        print("Hello, World!")
        return "Hello from Python!"
    
    # This is a simple Python function
    hello_world()
    """
    
    # Create attachment structure
    attachments = [{
        'type': 'text',
        'filename': 'hello.py',
        'content': text_content,
        'mime_type': 'text/x-python',
        'encoding': 'text'
    }]
    
    # Test the chatbot
    user_query = "Can you review this Python code and suggest improvements?"
    response = chatbot(user_query, attachments)
    
    print(f"User Query: {user_query}")
    print(f"AI Response: {response}")
    print("-" * 50)

def test_without_attachments():
    """Test chatbot without attachments (original functionality)"""
    print("Testing chatbot without attachments...")
    
    user_query = "What's the latest version of Python?"
    response = chatbot(user_query)
    
    print(f"User Query: {user_query}")
    print(f"AI Response: {response}")
    print("-" * 50)

def test_multiple_attachments():
    """Test chatbot with multiple attachments"""
    print("Testing chatbot with multiple attachments...")
    
    # First attachment - Python code
    code_content = """
    import requests
    
    def fetch_data(url):
        response = requests.get(url)
        return response.json()
    """
    
    # Second attachment - Config file
    config_content = """
    {
        "api_url": "https://api.example.com",
        "timeout": 30,
        "retries": 3
    }
    """
    
    attachments = [
        {
            'type': 'text',
            'filename': 'api_client.py',
            'content': code_content,
            'mime_type': 'text/x-python',
            'encoding': 'text'
        },
        {
            'type': 'text',
            'filename': 'config.json',
            'content': config_content,
            'mime_type': 'application/json',
            'encoding': 'text'
        }
    ]
    
    user_query = "Review these files and suggest how to improve error handling in the API client."
    response = chatbot(user_query, attachments)
    
    print(f"User Query: {user_query}")
    print(f"AI Response: {response}")
    print("-" * 50)

if __name__ == "__main__":
    print("Enhanced Chatbot Testing")
    print("=" * 50)
    
    # Run tests
    test_without_attachments()
    test_text_attachment()
    test_multiple_attachments()
    
    print("Testing completed!")
