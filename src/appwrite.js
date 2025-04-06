import { Client, Databases, Query, ID } from "appwrite";

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);
const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal('searchTerm', searchTerm),
        ]);
        if (result.documents.length > 0) {
            await updateDocument(result);
        } else {
            await createDocument(searchTerm, movie);
        }
    } catch (error) {
        console.error("Error updating search count:", error);
    }
}

export const getTrendingMovies = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(5),
            Query.orderDesc("count"),
        ]);

        return result.documents;
    } catch (error) {
        console.error("Error fetching trending movies:", error);    
    }
}

async function createDocument(searchTerm, movie) {
    await database.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
            searchTerm,
            count: 1,
            movie_id: movie.id,
            poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
        }
    );
}

async function updateDocument(result) {
    const doc = result.documents[0];
    await database.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        doc.$id,
        {
            count: doc.count + 1
        }
    );
}

