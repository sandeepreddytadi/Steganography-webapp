# app.py
from flask import Flask, render_template, request, send_file, jsonify
from PIL import Image
import os
from io import BytesIO
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import secrets

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SECRET_KEY'] = 'your-secret-key-here'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class Encryption:
    @staticmethod
    def generate_key(password: str, salt: bytes = None) -> tuple:
        if salt is None:
            salt = secrets.token_bytes(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return Fernet(key), salt

    @staticmethod
    def encrypt_message(message: str, password: str) -> tuple:
        fernet, salt = Encryption.generate_key(password)
        encrypted_message = fernet.encrypt(message.encode())
        return encrypted_message, salt

    @staticmethod
    def decrypt_message(encrypted_message: bytes, password: str, salt: bytes) -> str:
        try:
            fernet, _ = Encryption.generate_key(password, salt)
            decrypted_message = fernet.decrypt(encrypted_message).decode()
            return decrypted_message
        except Exception:
            raise ValueError("Invalid password or corrupted message")

class Steganography:
    @staticmethod
    def encode(img, data):
        """Encode data into an image using LSB technique."""
        binary_data = ''.join([format(b, '08b') for b in data])
        width, height = img.size
        max_bytes = width * height * 3 // 8
        
        if len(data) > max_bytes:
            raise ValueError("Error: Insufficient bytes, need bigger image or less data.")
            
        img_data = img.getdata()
        new_data = []
        data_index = 0
        
        for pixel in img_data:
            if data_index < len(binary_data):
                new_pixel = list(pixel)
                for i in range(0, 3):
                    if data_index < len(binary_data):
                        new_pixel[i] = new_pixel[i] & ~1 | int(binary_data[data_index])
                        data_index += 1
                new_data.append(tuple(new_pixel))
            else:
                new_data.append(pixel)
        
        img.putdata(new_data)
        return img

    @staticmethod
    def decode(img):
        """Decode data from an image using LSB technique."""
        img_data = img.getdata()
        binary_data = ""
        
        for pixel in img_data:
            for color in pixel[:3]:
                binary_data += str(color & 1)
        
        # Convert binary string to bytes
        all_bytes = []
        for i in range(0, len(binary_data), 8):
            byte = binary_data[i:i+8]
            if len(byte) == 8:
                all_bytes.append(int(byte, 2))
        
        decoded_data = bytes(all_bytes)
        return decoded_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/index2')
def index2():
    return render_template('index2.html')

@app.route('/encode', methods=['POST'])
def encode():
    try:
        # Get the uploaded image, message and password
        image_file = request.files['image']
        message = request.form['message']
        password = request.form['password']
        
        if not image_file or not message or not password:
            return jsonify({'error': 'Please provide image, message and password'}), 400
            
        # Encrypt the message with the password
        encrypted_message, salt = Encryption.encrypt_message(message, password)
        
        # Combine salt and encrypted message
        data_to_hide = salt + encrypted_message
        
        # Open and process the image
        img = Image.open(image_file)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Encode the encrypted message
        encoded_img = Steganography.encode(img, data_to_hide)
        
        # Save the result to a BytesIO object
        img_io = BytesIO()
        encoded_img.save(img_io, 'PNG')
        img_io.seek(0)
        
        # Convert to base64 for preview
        encoded_image = base64.b64encode(img_io.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'encoded_image': f'data:image/png;base64,{encoded_image}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/decode', methods=['POST'])
def decode():
    try:
        # Get the uploaded image and password
        image_file = request.files['image']
        password = request.form['password']
        
        if not image_file or not password:
            return jsonify({'error': 'Please provide both image and password'}), 400
            
        # Open and process the image
        img = Image.open(image_file)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Decode the data from the image
        decoded_data = Steganography.decode(img)
        
        # Extract salt and encrypted message
        salt = decoded_data[:16]
        encrypted_message = decoded_data[16:]
        
        # Decrypt the message using the password
        try:
            decrypted_message = Encryption.decrypt_message(encrypted_message, password, salt)
        except ValueError:
            return jsonify({'error': 'Invalid password or corrupted image'}), 400
        
        return jsonify({
            'success': True,
            'message': decrypted_message
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)