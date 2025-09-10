#!/usr/bin/env python3
"""
Simple test API server for Shauna chatbot
Implements the exact endpoints expected by the Angular frontend
"""

import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import logging

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
    """Chat endpoint - accepts JSON with message field"""
    try:
        # Handle JSON request
        if request.is_json:
            data = request.get_json()
            user_message = data.get('message', '')
            logger.info(f"Received message: {user_message}")
            
            # Simple echo response with timestamp
            response = {
                "response": f"Hello! You said: '{user_message}'. I'm Shauna, your AI assistant. How can I help you today?",
                "timestamp": datetime.datetime.now().isoformat(),
                "status": "success"
            }
            
            return jsonify(response), 200
            
        # Handle form data (for file uploads)
        elif request.form:
            user_message = request.form.get('message', '')
            files = request.files.getlist('files')
            
            logger.info(f"Received message with files: {user_message}, {len(files)} files")
            
            file_info = []
            for file in files:
                if file.filename:
                    file_info.append(f"{file.filename} ({file.content_type})")
            
            response_text = f"I received your message: '{user_message}'"
            if file_info:
                response_text += f" along with {len(file_info)} file(s): {', '.join(file_info)}"
            
            response = {
                "response": response_text,
                "timestamp": datetime.datetime.now().isoformat(),
                "status": "success"
            }
            
            return jsonify(response), 200
            
        else:
            return jsonify({"error": "No message provided"}), 400
            
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
        "name": "Shauna Chatbot API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "chat": "/api/chat"
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("Starting Shauna Chatbot API Server...")
    print("Endpoints:")
    print("  GET  /api/health - Health check")
    print("  POST /api/chat    - Send chat message")
    print("  GET  /api/        - API information")
    print("\nServer will run on https://localhost:4000")
    print("CORS is enabled for all origins")
    
    # Run with SSL context for HTTPS
    try:
        # For development, we'll use HTTP instead of HTTPS to avoid certificate issues
        app.run(host='localhost', port=4000, debug=True, ssl_context='adhoc')
    except Exception as e:
        print(f"HTTPS failed, falling back to HTTP: {e}")
        print("Running on http://localhost:4000 instead")
        app.run(host='localhost', port=4000, debug=True)
