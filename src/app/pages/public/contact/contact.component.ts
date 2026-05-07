import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators,} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {RequestService} from "../../../core/services/request.service";
import {CONTACT_API_URL} from "../../../utils/api.url.constants";
import {NgxMaskDirective} from "ngx-mask";
import {RegexConstants} from "../../../utils/regex-constants";
import {getError} from "../../../utils/global.utils";

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, NgxMaskDirective],
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
    contactForm!: FormGroup;
    isLoading = false;
    submitSuccess = false;
    submitError = '';
    errorMessages = {
        phone: {required: 'Phone is required', pattern: 'Invalid Pakistani phone number'},
        email: {
            required: 'Email is required',
            maxlength: 'Max 32 characters',
            email: 'Provide valid email', pattern: 'Provide valid email'
        },
        subject: {
            required: 'Subject is required',
        },
        name: {
            required: 'Name is required',
            pattern: "Only alphanumeric characters are allowed.",
            maxLength: 'Max 50 characters'
        },
        message: {
            required: 'Message is required',
            minlength: 'Min 10 characters',
            maxlength: 'Max 500 characters',
        }
    };

    constructor(private fb: FormBuilder, private http: HttpClient, private requestService: RequestService) {
    }

    ngOnInit(): void {
        this.contactForm = this.fb.group({
            name: ['', [Validators.required,
                Validators.minLength(1),
                Validators.maxLength(50),
                Validators.pattern(RegexConstants.ALPHANUMERIC_REGEX)]],
            email: ['', [Validators.required,
                Validators.email,
                Validators.pattern(RegexConstants.VALID_EMAIL_REGEX),
                Validators.maxLength(32)]],
            phone: ['', [Validators.required,
                Validators.pattern(RegexConstants.PHONE_REGEX)]],
            organization: [''],
            subject: ['', Validators.required],
            message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
        });
    }

    isFieldInvalid(field: string): boolean {
        const ctrl = this.contactForm.get(field);
        return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
    }

    onSubmit(): void {
        if (this.contactForm.invalid) {
            this.contactForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.submitSuccess = false;
        this.submitError = '';

        const payload = this.contactForm.value;

        this.requestService.postRequest(CONTACT_API_URL, payload).subscribe({
            next: () => {
                this.isLoading = false;
                this.submitSuccess = true;
                this.contactForm.reset();
                setTimeout(() => {
                    this.submitSuccess = false;
                }, 20000);
            },
            error: (err) => {
                this.isLoading = false;
                this.submitError = err?.error?.message
                    || 'Something went wrong. Please email us directly at info@datanurse.io';
                setTimeout(() => {
                    this.submitError = '';
                }, 20000);
            },
        });
    }

    getErrorMsg(controlName: string, index?: number, field?: string) {
        return getError(this.contactForm, controlName, {
            index,
            field,
            customMessages: this.errorMessages
        });
    }
}
