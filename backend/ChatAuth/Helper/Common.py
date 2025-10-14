import base64
from datetime import datetime, timedelta
import hashlib
from math import dist
import os
import random
import string
import traceback
import uuid
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
from dotenv import load_dotenv

load_dotenv() 

GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
ENCRYPTION_FIXED_KEY = os.getenv("ENCRYPTION_FIXED_KEY")
ALGORITHM = "HS256"

user_sessions = {}

# Security
security = HTTPBearer()

def GetSha1Hash(raw_data: str) -> str:
    try:
        sha1_hash = hashlib.sha1()
        sha1_hash.update(raw_data.encode('utf-8'))
        return sha1_hash.hexdigest()
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        raise Exception(error_msg)


async def _GenerateRandomString(length: int = 32) -> str:
    try:
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        raise Exception(error_msg)

async def _AES_Encrypt(plain_text: str, key: bytes) -> str:
    try:
        if len(key) not in (16, 24, 32):
            raise ValueError(f"Invalid AES key length: {len(key)} bytes")

        iv = get_random_bytes(16)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        padded_data = pad(plain_text.encode('utf-16le'), AES.block_size)
        encrypted = cipher.encrypt(padded_data)
        return base64.b64encode(iv + encrypted).decode()
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        raise Exception(error_msg)

async def _AES_Decrypt(encrypted_text: str, key: bytes) -> str:
    try:
        if len(key) not in (16, 24, 32):
            raise ValueError(f"Invalid AES key length: {len(key)} bytes")

        decoded = base64.b64decode(encrypted_text)
        iv = decoded[:16]
        cipher_text = decoded[16:]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted = unpad(cipher.decrypt(cipher_text), AES.block_size)
        return decrypted.decode('utf-16le')
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        raise Exception(error_msg)

async def _DeriveAESKey(key_str: str, length=32) -> bytes:
    return hashlib.sha256(key_str.encode('utf-8')).digest()[:length]

async def GetEncryptedText(plain_text: str) -> str:
    try:
        random_key_str = await _GenerateRandomString()  # e.g. 32 chars
        random_key = await _DeriveAESKey(random_key_str, 32)
        fixed_key = await _DeriveAESKey(ENCRYPTION_FIXED_KEY, 32)

        e_text = await _AES_Encrypt(plain_text, random_key)
        e_key = await _AES_Encrypt(random_key_str, fixed_key)

        return base64.b64encode((e_key + '::' + e_text).encode('utf-8')).decode('utf-8')
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        raise Exception(error_msg)

async def GetDecryptedText(encrypted_text: str) -> str | None:
    try:
        if encrypted_text:
            decoded = base64.b64decode(encrypted_text).decode('utf-8')
            e_key, e_text = decoded.split('::', 1)

            fixed_key = await _DeriveAESKey(ENCRYPTION_FIXED_KEY, 32)
            plain_random_key = await _AES_Decrypt(e_key, fixed_key)
            random_key = await _DeriveAESKey(plain_random_key, 32)

            return await _AES_Decrypt(e_text, random_key)
        return ''
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        raise Exception(error_msg)
    
async def CreateJwtToken(user_data: dist) -> str:
    start_date = datetime.now()
    expiry_date = start_date + timedelta(minutes=60)
    payload = {
        "UserId": await GetEncryptedText(user_data.get("email")),
        "SessionID": await GetEncryptedText(f"{str(uuid.uuid4())}#{start_date.strftime('%Y-%m-%d %H:%M:%S')}"),
        "StartDate": start_date.isoformat(),
        "ExpiryDate": expiry_date.isoformat()
    }
    token = jwt.encode(
        payload,
        GOOGLE_CLIENT_SECRET,
        algorithm=ALGORITHM
    )
    user_sessions[GetSha1Hash(token)] = user_data

    return token


async def VerifyJwtToken(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        now_date = datetime.now()
        token = credentials.credentials
        
        payload = jwt.decode(token, GOOGLE_CLIENT_SECRET, algorithms=ALGORITHM)
        
        user_id = await GetDecryptedText(payload.get("UserId"))
        expiry_date_str = payload.get("ExpiryDate")
        if expiry_date_str:
            try:
                expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%dT%H:%M:%S.%f')
            except ValueError:
                expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%dT%H:%M:%S')
            
        session_id = await GetDecryptedText(payload.get("SessionID"))
        
        if GetSha1Hash(token) not in user_sessions:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        if not user_id or not session_id:
            del user_sessions[GetSha1Hash(token)]
            raise HTTPException(status_code=401, detail="Valid token required")

        if now_date > expiry_date:
            del user_sessions[GetSha1Hash(token)]
            raise HTTPException(status_code=401, detail="Token expired")
        
        return user_sessions[GetSha1Hash(token)]
    except Exception as ex:
        error_msg = f"{str(ex)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=401, detail=f"Valid token required. {error_msg}")
    
async def Logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if GetSha1Hash(token) in user_sessions:
        del user_sessions[GetSha1Hash(token)]
    return True

async def  AddLogOrErrorInFile(message: str, type: str):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = (
            f"{timestamp} <======> {type} <======> {message}\n\n"
            f"{'*' * 100}\n\n"
        )

        # Build path
        log_dir = "/app/logs"
        os.makedirs(log_dir, exist_ok=True)

        # Log file name based on date
        log_filename = f"ChatAuth - {datetime.now().strftime('%d-%m-%Y')}.txt"
        log_path = os.path.join(log_dir, log_filename)

        # Append log message
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(log_message)
    except Exception as ex:
        print(f"Logging failed: {ex}")