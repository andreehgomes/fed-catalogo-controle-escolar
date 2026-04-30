import { Injectable } from "@angular/core";
import { Storage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "@angular/fire/storage";
import { Observable } from "rxjs";
import { FileUploadModel } from "../../model/file-upload-model";

@Injectable({
  providedIn: "root",
})
export class FileService {
  private basePath = "/uploads";

  constructor(private storage: Storage) {}

  pushFileToStorage(fileUpload: FileUploadModel): Observable<{ fileName: string; url: string }> {
    const fileName = `${this.returnRandonHash()}-${fileUpload.file.name}`;
    const filePath = `${this.basePath}/${fileName}`;
    const fileRef = storageRef(this.storage, filePath);

    return new Observable((observer) => {
      uploadBytes(fileRef, fileUpload.file)
        .then(() => {
          getDownloadURL(fileRef).then((url) => {
            observer.next({ fileName, url });
            observer.complete();
          });
        })
        .catch((error) => observer.error(error));
    });
  }

  returnRandonHash(): string {
    return Math.floor(Date.now() * Math.random()).toString(36);
  }

  deleteFileStorage(nome: string): Observable<any> {
    return new Observable((observer) => {
      const fileRef = storageRef(this.storage, `${this.basePath}/${nome}`);
      deleteObject(fileRef)
        .then(() => {
          observer.next(null);
          observer.complete();
        })
        .catch(() => {
          observer.next(null);
          observer.complete();
        });
    });
  }
}
