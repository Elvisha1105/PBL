
import cv2
import numpy as np
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

# PARAMETERS
VIDEO_PATH = 'test_3.mp4'
CROWD_THRESHOLD = 60
  # Change to your desired threshold!

def send_alert_email_with_image(person_count, image_path):
    sender_email = "miahehehe17@gmail.com"
    receiver_email = "vjjoan77@gmail.com"
    password = "doke qyxj sfti aigi"  # Use Gmail App Password

    subject = "Crowd Alert: Overcrowded"
    body = f"Warning! Overcrowding detected. Person count: {person_count}"

    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg.attach(MIMEText(body))

    # Attach image
    with open(image_path, "rb") as attachment:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(attachment.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f"attachment; filename={image_path}")
    msg.attach(part)

    server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
    server.login(sender_email, password)
    server.sendmail(sender_email, receiver_email, msg.as_string())
    server.quit()
    print("Alert email with image sent!")

cap = cv2.VideoCapture(VIDEO_PATH)
fgbg = cv2.createBackgroundSubtractorMOG2()
alert_sent = False

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    fgmask = fgbg.apply(frame)
    kernel = np.ones((5, 5), np.uint8)
    clean_mask = cv2.morphologyEx(fgmask, cv2.MORPH_OPEN, kernel)
    clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    person_count = 0
    for cnt in contours:
        if cv2.contourArea(cnt) > 10:  # Threshold for noise, adjust as needed
            x, y, w, h = cv2.boundingRect(cnt)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            person_count += 1

    cv2.putText(frame, f'Count: {person_count}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
    cv2.imshow('Detected Crowd', frame)
    cv2.imshow('Cleaned Mask', clean_mask)

    # Send alert email with attached image once per run
    if person_count >= CROWD_THRESHOLD and not alert_sent:
        image_path = 'crowd_detected.jpg'
        cv2.imwrite(image_path, frame)
        send_alert_email_with_image(person_count, image_path)
        alert_sent = True

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
