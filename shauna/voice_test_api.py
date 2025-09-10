#!/usr/bin/env python3
"""
Simple test API server for Shauna chatbot voice testing
Implements the exact endpoints expected by the Angular frontend
"""

import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint - returns JSON with status"""
    logger.info("Health check requested")
    return jsonify({"status": "healthy"}), 200

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat endpoint - accepts JSON with message and attachments fields"""
    try:
        # Add a small delay to simulate processing
        time.sleep(1)
        
        # Handle JSON request with new format
        if request.is_json:
            data = request.get_json()
            user_message = data.get('message', '')
            attachments = data.get('attachments', [])
            
            logger.info(f"Received message: {user_message}")
            logger.info(f"Received {len(attachments)} attachments")
            
            # Process attachments
            attachment_info = []
            for attachment in attachments:
                attachment_info.append({
                    'name': attachment.get('name', 'unknown'),
                    'type': attachment.get('type', 'unknown'),
                    'size': attachment.get('size', 0)
                })
            
            # Create varied responses for testing voice
            if attachment_info:
                response_text = f"I received your message: '{user_message}' with {len(attachment_info)} attachment(s): "
                response_text += ", ".join([f"{att['name']} ({att['type']})" for att in attachment_info])
                response_text += ". Voice responses work great with file attachments!"
            else:
                responses = [
                    f"Hello! I heard you say: '{user_message}'. I'm Shauna, your AI assistant. How can I help you today?",
                    f"That's interesting! You mentioned: '{user_message}'. Let me think about that for a moment.",
                    f"Thank you for saying: '{user_message}'. I'm here to assist you with any questions you might have.",
                    f"I understand you said: '{user_message}'. This is a test response to check voice functionality.",
                    f"Great question about: '{user_message}'. Voice recognition seems to be working perfectly!"
                ]
                response_text = responses[len(user_message) % len(responses)]
            
            response = {
                "response": response_text,
                "timestamp": datetime.datetime.now().isoformat(),
                "status": "success"
            }
            
            return jsonify(response), 200
            
        else:
            return jsonify({"error": "JSON request body required with 'message' and 'attachments' fields"}), 400
            
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        "name": "Shauna Chatbot Voice Test API",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "health": "/api/health",
            "chat": "/api/chat"
        },
        "request_format": {
            "chat": {
                "method": "POST",
                "content_type": "application/json",
                "body": {
                    "message": "string - user input message",
                    "attachments": [
                        {
                            "name": "string - filename",
                            "content": "string - base64 encoded file content",
                            "type": "string - MIME type",
                            "size": "number - file size in bytes"
                        }
                    ]
                }
            }
        },
        "features": [
            "Voice input support",
            "Voice response testing",
            "Base64 file attachment handling",
            "CORS enabled"
        ]
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🎤 Starting Shauna Chatbot Voice Test API Server...")
    print("Endpoints:")
    print("  GET  /api/health - Health check (JSON format)")
    print("  POST /api/chat    - Send chat message (supports voice testing)")
    print("  GET  /api/        - API information")
    print("\nFeatures:")
    print("  ✅ Voice input recognition support")
    print("  ✅ Voice response testing")
    print("  ✅ Loading music integration")
    print("  ✅ File upload handling")
    print("  ✅ CORS enabled for Angular frontend")
    print(f"\n🚀 Server running on http://localhost:4000")
    print("💡 Use microphone button in Angular app to test voice features!")
    
    # Run on HTTP for easier testing
    app.run(host='localhost', port=4000, debug=True)
