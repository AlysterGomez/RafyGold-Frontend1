import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("Tentative de connexion...")
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    try:
        await client.admin.command('ping')
        print("SUCCÈS : Connexion établie avec MongoDB !")
    except Exception as e:
        print(f"ÉCHEC : Voici l'erreur exacte : \n{e}")

asyncio.run(test())