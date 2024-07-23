"use server";

import { CreateUserParams, RegisterUserParams } from "@/types";
import { ID, Query } from "node-appwrite";
import {
	BUCKET_ID,
	DATABASE_ID,
	databases,
	ENDPOINT,
	PATIENT_COLLECTION_ID,
	PROJECT_ID,
	storage,
	users,
} from "../appwrite.config";
import { parseStringify } from "../utils";
import { InputFile } from "node-appwrite/file";

export const createUser = async (user: CreateUserParams) => {
  try {
    // Create new user -> https://appwrite.io/docs/references/1.5.x/server-nodejs/users#create
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );

    return parseStringify(newUser);
  } catch (error: any) {
    // Check existing user
    if (error && error?.code === 409) {
      const existingUser = await users.list([
        Query.equal("email", [user.email]),
      ]);

      return existingUser.users[0];
    }
    console.error("An error occurred while creating a new user:", error);
  }
};

export const getUser = async (userId: string) => {
	try {
		const user = await users.get(userId);
		return parseStringify(user);
	} catch (e) {
		console.log("error", e);
	}
};

export const getPatient = async (userId: string) => {
	try {
		const patient = await databases.listDocuments(
			DATABASE_ID!,
			PATIENT_COLLECTION_ID!,
			[Query.equal("userId", [userId])]
		);

		return parseStringify(patient.documents[0]);
	} catch (e) {
		console.error("Error", e);
	}
};

export const registerPatient = async ({
	identificationDocument,
	...patient
}: RegisterUserParams) => {
	try {
		let file;
		if (identificationDocument) {
			const inputFile = InputFile.fromBuffer(
				identificationDocument?.get("blobFile") as Blob,
				identificationDocument?.get("fileName") as string
			);
			file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
		}
		const newPatient = await databases.createDocument(
			DATABASE_ID!,
			PATIENT_COLLECTION_ID!,
			ID.unique(),
			{
				identificationDocumentId: file?.$id || null,
				identificationDocumentUrl: `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${
					file?.$id
				}/view?project=${PROJECT_ID!}`,
				...patient,
			}
		);

		return parseStringify(newPatient);
	} catch (e) {
		console.error(e);
	}
};
