export class RegexConstants {
    public static PHONE_REGEX = /^\+92-(?:3\d{2}|\d{2,3})-\d{7}$/;
    public static PMDC_REGEX = /^PMDC-\d{5}$/;
    public static TIN_REGEX = /^\d{7,12}$/;
    public static NPI_REGEX = /^\d{10}$/;
    public static VALID_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    public static NO_SPACE_REGEX = /^\S+$/;
    public static ALPHABET_REGEX = /^[A-Za-z ]+$/;
    public static PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
}
