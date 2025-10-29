
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys
import base64

def send_email(receiver_email, subject, body):
    """
    Sends an email using SMTP.
    You need to replace the placeholder values with your actual SMTP server details and credentials.
    """
    # --- SMTP Server Configuration ---
    # Replace with your SMTP server address (e.g., 'smtp.gmail.com' for Gmail)
    smtp_host = "smtp.gmail.com"
    # Replace with your SMTP server port (e.g., 587 for TLS, 465 for SSL)
    smtp_port = 587

    # --- Email Credentials ---
    # Replace with your email address
    sender_email = "mouffaq.dalloul@gmail.com"
    # IMPORTANT: It's recommended to use an app-specific password if your email provider supports it.
    # Replace with your email password or app-specific password
    password = "tjnw yxtv ydso odrl"

    # --- Create the Email Message ---
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender_email
    message["To"] = receiver_email

    # Attach the body to the email
    message.attach(MIMEText(body, "html"))

    # --- Send the Email ---
    try:
        # Create a secure SSL context
        context = ssl.create_default_context()

        # Connect to the SMTP server
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            # Start TLS for security
            server.starttls(context=context)
            # Login to the server
            server.login(sender_email, password)
            # Send the email
            server.sendmail(sender_email, receiver_email, message.as_string())
        
        print("Email sent successfully!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python send_email.py <receiver_email> <subject> <base64_encoded_body>")
        sys.exit(1)
    
    receiver_email = sys.argv[1]
    subject = sys.argv[2]
    encoded_body = sys.argv[3]
    body = base64.b64decode(encoded_body).decode('utf-8')
    
    send_email(receiver_email, subject, body)
