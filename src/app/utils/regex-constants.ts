export class RegexConstants {
    public static PHONE_REGEX = /^\+92-3\d{2}-\d{7}$/;
    public static NUMERIC_REGEX = /^[0-9]+$/;
    public static VALID_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    public static NO_SPACE_REGEX = /^\S+$/;
    public static LOV_CODE_REGEX = /^[A-Za-z0-9,\-_*&+.]+$/;
    public static ALPHABET_REGEX = /^[A-Za-z ]+$/;
    public static NAME_SPECIAL_REGEX = /^(?!\s*$)[A-Za-z0-9,\-_*&+.\s()]+$/;
    public static NAME_REGEX = /^[A-Za-z .,-_]+$/;
    public static PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
}
