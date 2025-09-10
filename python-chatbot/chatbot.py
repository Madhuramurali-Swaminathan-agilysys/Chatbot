from dotenv import load_dotenv
import os
import base64
from typing import List, Dict, Optional
from poml.integration.langchain import LangchainPomlTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage

load_dotenv()
model = "gemini-2.5-flash-lite"
google_api_key = os.getenv("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(model = model, google_api_key = google_api_key)

def chatbot(user_input: str, attachments: Optional[List[Dict]] = None):
    """
    Enhanced chatbot function that accepts user input and optional attachments.
    
    Args:
        user_input (str): The user's text query
        attachments (List[Dict], optional): List of attachment dictionaries containing:
            - 'type': 'image', 'text', 'document', etc.
            - 'content': Base64 encoded content or text content
            - 'filename': Original filename
            - 'mime_type': MIME type of the attachment
    
    Returns:
        str: AI response incorporating both query and attachments
    """
    
    # Prepare the question with attachment context
    formatted_question = user_input
    
    if attachments:
        attachment_context = "\n\nAttachments provided:\n"
        for i, attachment in enumerate(attachments, 1):
            attachment_context += f"{i}. {attachment.get('filename', 'Unknown file')} ({attachment.get('type', 'unknown type')})\n"
            
            # Handle different attachment types
            if attachment.get('type') == 'text' or attachment.get('mime_type', '').startswith('text/'):
                # For text attachments, include the content directly
                content = attachment.get('content', '')
                if attachment.get('encoding') == 'base64':
                    try:
                        content = base64.b64decode(content).decode('utf-8')
                    except:
                        content = "Unable to decode text content"
                attachment_context += f"   Content: {content[:500]}{'...' if len(content) > 500 else ''}\n"
            
            elif attachment.get('type') == 'image':
                attachment_context += f"   Image file provided for analysis\n"
            
            else:
                attachment_context += f"   File type: {attachment.get('mime_type', 'unknown')}\n"
        
        formatted_question = user_input + attachment_context
    
    # For image attachments, we need to use a different approach with Gemini
    if attachments and any(att.get('type') == 'image' for att in attachments):
        # Handle image attachments with multimodal messages
        messages = []
        
        # Add text content
        message_content = [{"type": "text", "text": formatted_question}]
        
        # Add image content
        for attachment in attachments:
            if attachment.get('type') == 'image':
                try:
                    image_data = attachment.get('content', '')
                    if not image_data.startswith('data:'):
                        # Add data URL prefix if not present
                        mime_type = attachment.get('mime_type', 'image/jpeg')
                        image_data = f"data:{mime_type};base64,{image_data}"
                    
                    message_content.append({
                        "type": "image_url",
                        "image_url": {"url": image_data}
                    })
                except Exception as e:
                    print(f"Error processing image attachment: {e}")
        
        # Create message with multimodal content
        human_message = HumanMessage(content=message_content)
        ai_response = llm.invoke([human_message])
        return ai_response.content
    
    else:
        # Use the original prompt template for text-only queries
        prompt = LangchainPomlTemplate.from_file("prompt.poml")
        chain = prompt | llm | StrOutputParser()
        ai_response = chain.invoke({"question": formatted_question})
        return ai_response

if __name__ == "__main__":
    while True:
        user_input = input("YOU: ")
        if user_input.lower() in ['quit', 'bye']:
            print("Goodbye!")
            break
        
        # For command line usage, no attachments are passed
        response = chatbot(user_input)
        print("AI:", response)
            