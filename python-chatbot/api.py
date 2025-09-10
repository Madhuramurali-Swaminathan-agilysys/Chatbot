from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import chatbot

app = Flask(__name__)
CORS(app)

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from chatbot import chatbot
import base64
import mimetypes

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message", "")
        attachments = data.get("attachments", [])
        
        # Process attachments if any
        processed_attachments = []
        for attachment in attachments:
            processed_attachment = {
                'type': attachment.get('type', 'unknown'),
                'filename': attachment.get('filename', 'unknown'),
                'content': attachment.get('content', ''),
                'mime_type': attachment.get('mime_type', ''),
                'encoding': attachment.get('encoding', 'base64')
            }
            
            # Determine type from mime_type if not specified
            if processed_attachment['type'] == 'unknown' and processed_attachment['mime_type']:
                if processed_attachment['mime_type'].startswith('image/'):
                    processed_attachment['type'] = 'image'
                elif processed_attachment['mime_type'].startswith('text/'):
                    processed_attachment['type'] = 'text'
                elif processed_attachment['mime_type'] in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                    processed_attachment['type'] = 'document'
            
            processed_attachments.append(processed_attachment)
        
        # Call chatbot with message and attachments
        ai_response = chatbot(message, processed_attachments if processed_attachments else None)
        
        return jsonify({
            "response": ai_response,
            "attachments_processed": len(processed_attachments)
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "response": "Sorry, I encountered an error processing your request."
        }), 500

@app.route("/api/chat/upload", methods=["POST"])
def chat_with_upload():
    try:
        # Handle form data with files
        message = request.form.get("message", "")
        files = request.files.getlist("files")
        
        processed_attachments = []
        
        for file in files:
            if file and file.filename:
                # Read file content
                file_content = file.read()
                encoded_content = base64.b64encode(file_content).decode('utf-8')
                
                # Determine file type
                mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
                
                attachment_type = 'unknown'
                if mime_type.startswith('image/'):
                    attachment_type = 'image'
                elif mime_type.startswith('text/'):
                    attachment_type = 'text'
                elif mime_type in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                    attachment_type = 'document'
                
                processed_attachment = {
                    'type': attachment_type,
                    'filename': file.filename,
                    'content': encoded_content,
                    'mime_type': mime_type,
                    'encoding': 'base64'
                }
                
                processed_attachments.append(processed_attachment)
        
        # Call chatbot with message and attachments
        ai_response = chatbot(message, processed_attachments if processed_attachments else None)
        
        return jsonify({
            "response": ai_response,
            "files_processed": len(processed_attachments)
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "response": "Sorry, I encountered an error processing your uploaded files."
        }), 500

@app.route("/api/health" , methods = ["GET"])
def health():
    return jsonify({"status" : "healthy"})

if __name__ == "__main__":  
    app.run(debug=True, port=4000)