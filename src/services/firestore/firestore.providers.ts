import { UserDocument } from 'src/entities/user/user.document'

export const FirestoreDatabaseProvider = 'firestoredb'
export const FirestoreOptionsProvider = 'firestoreOptions'
export const FirestoreCollectionProviders: string[] = [UserDocument.collectionName]
