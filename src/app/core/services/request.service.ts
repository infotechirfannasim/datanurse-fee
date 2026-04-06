import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AppConstants } from '../../utils/app-constants';

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  constructor(private http: HttpClient) {}

  getUnAuthBasicHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization:
        'Basic ' + btoa(environment.api_access_client + ':' + environment.api_secret_client),
    });
  }

  getBasicMultipartHeaders(): HttpHeaders {
    let reqHeader = null;
    reqHeader = new HttpHeaders({
      Authorization: 'Bearer ' + this.getToken(),
    });
    return reqHeader;
  }

  getBEAPIServer() {
    let protocol = environment.http_protocol;
    let server = environment.api_end_point_url;
    let port = environment.api_end_point_port;
    let contextPath = environment.api_context_path;
    if (protocol === '' || !protocol || server === '' || !server) {
      return '';
    } else {
      if (port === '' || !port) {
        return (
          protocol + environment.http_separator + server + ':' + port + contextPath + '/api/v1/'
        );
      } else {
        return (
          protocol + environment.http_separator + server + ':' + port + contextPath + '/api/v1/'
        );
      }
    }
  }

  postAccessTokenRequest(url: any, params: any) {
    const reqHeader = new HttpHeaders({
      Authorization:
        'Basic ' + window.btoa(environment.api_access_client + ':' + environment.api_secret_client),
    });
    return this.http.post(this.getBEAPIServer() + url, params, {
      headers: reqHeader,
      observe: 'response',
    });
  }

  postSignInRequest(url: any, params?: any) {
    let headers = this.getBasicHeaders();
    return this.http.post(this.getBEAPIServer() + url, params, {
      headers: headers,
      observe: 'response',
    });
  }

  postUnAuthRequest(url: any, params: any) {
    let headers = this.getUnAuthBasicHeaders();
    return this.http.post(this.getBEAPIServer() + url, params, {
      headers: headers,
      observe: 'response',
    });
  }

  putUnAuthRequest(url: any, params: any) {
    let headers = this.getUnAuthBasicHeaders();
    return this.http.put(this.getBEAPIServer() + url, params, {
      headers: headers,
      observe: 'response',
    });
  }

  postRequest(url: any, params: any) {
    let headers = this.getBasicHeaders();
    // params.createdBy = this.getLoggedInUserId();
    // params.updatedBy = this.getLoggedInUserId();
    return this.http.post(this.getBEAPIServer() + url, params, {
      headers: headers,
      observe: 'response',
    });
  }

  postETBNTBRequest(url: any, params: any) {
    let headers = this.getBasicHeaders();
    return this.http.post(this.getBEAPIServer() + url, params, {
      headers: headers,
      observe: 'response',
    });
  }

  postLOVRequest(url: any, params: any) {
    let headers = this.getBasicHeaders();
    return this.http.post(this.getBEAPIServer() + url, JSON.stringify(params), {
      headers: headers,
      observe: 'response',
    });
  }

  putLOVRequest(url: any, params: any) {
    let headers = this.getBasicHeaders();
    return this.http.put(this.getBEAPIServer() + url, JSON.stringify(params), {
      headers: headers,
      observe: 'response',
    });
  }

  searchLOVRequest(url: any, params: any) {
    let headers = this.getBasicHeaders();
    return this.http.post(this.getBEAPIServer() + url, params, {
      headers: headers,
      observe: 'response',
    });
  }

  postRequestMultipartFormAndDataForExam(url: any, data: any) {
    let headers = this.getBasicMultipartHeaders();
    data.createdBy = this.getLoggedInUserId();
    data.updatedBy = this.getLoggedInUserId();
    let formData: FormData = new FormData();
    formData.append('data', JSON.stringify(data));
    data.questions.forEach((question: { options: any[] }) => {
      question.options.forEach(({ file, tempFileId }) => {
        if (file && tempFileId) {
          formData.append('files[]', file, tempFileId);
          // formData.append('file', file.orgFile, file.orgFile.firstName);
        }
      });
    });
    return this.http.post(this.getBEAPIServer() + url, formData, {
      headers: headers,
      observe: 'response',
    });
  }

  getMultipartHeaders(): HttpHeaders {
    const token = this.getToken();

    // Initialize an empty HttpHeaders object
    let reqHeader = new HttpHeaders();

    // Set the Authorization header only if the token exists
    if (token) {
      reqHeader = reqHeader.set('Authorization', token);
    }

    return reqHeader;
  }

  postMultipartRequest(url: any, params: any) {
    const reqHeader = this.getMultipartHeaders();
    let formData: FormData = new FormData();
    Object.keys(params).forEach((key) => {
      if (typeof params[key] === 'object') {
        if (params[key] instanceof File) {
          formData.append(key, params[key]);
        } else {
          const blob = new Blob([JSON.stringify(params[key])], { type: 'application/json' });
          formData.append(key, blob);
        }
      } else {
        formData.append(key, params[key]);
      }
    });

    let URL = this.getBEAPIServer() + url;
    return this.http.post(URL, formData, { headers: reqHeader, observe: 'response' });
  }

  postReqWithFormData(url: any, params: FormData) {
    const reqHeader = this.getMultipartHeaders();
    // params.append('createdBy', this.getLoggedInUserId() as string);
    // params.append('updatedBy', this.getLoggedInUserId() as string);
    let URL = this.getBEAPIServer() + url;
    return this.http.post(URL, params, { headers: reqHeader, observe: 'response' });
  }

  patchReqWithFormData(url: any, params: FormData) {
    const reqHeader = this.getMultipartHeaders();
    let URL = this.getBEAPIServer() + url;
    return this.http.patch(URL, params, { headers: reqHeader, observe: 'response' });
  }

  postRequestMultipartFormAndDataUpload(url: any, file: any, data: any) {
    let headers = this.getBasicMultipartHeaders();
    let formData: FormData = new FormData();
    // formData.append('reqObj', new Blob([JSON.stringify(data)], {
    //     type: 'application/json'
    // }));
    if (file) {
      formData.append('file', file.orgFile, file.orgFile.firstName);
    }

    return this.http.post(this.getBEAPIServer() + url, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events',
      responseType: 'text',
    });
  }

  putRequest(url: any, body: any, params?: any) {
    let headers = this.getBasicHeaders();
    // params.createdBy = this.getLoggedInUserId();
    // body.updatedBy = this.getLoggedInUserId();
    return this.http.put(this.getBEAPIServer() + url, body, {
      headers: headers,
      params,
      observe: 'response',
    });
  }

  patchRequest(url: any, body: any, params?: any) {
    let headers = this.getBasicHeaders();
    // params.createdBy = this.getLoggedInUserId();
    // body.updatedBy = this.getLoggedInUserId();
    return this.http.patch(this.getBEAPIServer() + url, body, {
      headers: headers,
      params,
      observe: 'response',
    });
  }

  getRequest(url: any, params?: any) {
    let headers = this.getBasicHeaders();
    return this.http.get(this.getBEAPIServer() + url, {
      headers: headers,
      params: params,
      observe: 'response',
    });
  }

  getSVGRequest(url: any) {
    return this.http.get(url, { responseType: 'text', observe: 'response' });
  }

  getRequestFile(url: any, params?: any) {
    let headers = this.getBasicHeaders();
    return this.http.get(this.getBEAPIServer() + url, {
      headers: headers,
      responseType: 'json',
      observe: 'response',
    });
  }

  getRequestFileBuffer(url: any, params?: any) {
    let headers = this.getBasicHeaders();
    return this.http.get(this.getBEAPIServer() + url, {
      headers: headers,
      responseType: 'arraybuffer',
    });
  }

  deleteRequest(url: any, params?: any) {
    let headers = this.getBasicHeaders();
    return this.http.delete(this.getBEAPIServer() + url, {
      headers: headers,
      body: params,
      observe: 'response',
    });
  }

  public getLoggedInUserId(): string | null {
    return localStorage.getItem(window.btoa(AppConstants.USER_ID));
  }

  putRequestMultipartFileUpload(url: any, file: any) {
    let headers = this.getBasicMultipartHeaders();
    let formData: FormData = new FormData();
    if (file) {
      formData.append('file', file, file.firstName);
    }

    return this.http.put(this.getBEAPIServer() + url, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events',
      responseType: 'text',
    });
  }

  private getToken() {
    return localStorage.getItem(window.btoa(AppConstants.AUTH_ACCESS_TOKEN));
  }

  private getBasicHeaders(): HttpHeaders {
    let reqHeader = null;
    reqHeader = new HttpHeaders({
      Authorization: `${this.getToken()}`,
      'Content-Type': 'application/json',
    });
    return reqHeader;
  }
}
