export class RegexConstants {
    public static PASSWORD_COMPLEXITY_REGX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]*$/;
    public static EXCLUDED_SPECIAL_CHARS_REGX = /^[^\\/:*?"<>|]*$/;
    public static VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    public static ALPHABET_REGEX = /^[a-zA-Z ]+$/;
    public static ALPHANUMERIC_REGEX = /^[a-zA-Z0-9 ]+$/;
    // public static ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/;  regex for not accepting space at start and at end of input
    public static ALPHANUMERIC_WITHOUT_SPACE_REGEX = /^[a-zA-Z0-9]+$/;
    public static ALPHANUMERIC_WITHOUT_SPACE_AND_WITH_DOT_REGEX = /^[a-zA-Z0-9.]+$/;
    public static ALPHANUMERIC_WITH_PLUS_REGEX = /^[a-zA-Z0-9+ ]+$/;
    public static ALPHANUMERIC_WITH_SPECIAL_CHAR_REGEX = /^[a-zA-Z0-9\-_/.%#?, \n]+$/;
    public static ALPHANUMERIC_WITH_SPECIAL_CHAR_REGEX1 = /^[a-zA-Z0-9\-_/%., \n]+$/;
    public static NUMBER_REGEX = /^[0-9]+$/;
    public static NUMBERS_WITH_PLUS_REGEX = /^[0-9+]+$/;
    public static NUMBERS_WITH_HYPHEN_REGEX = /^[0-9-]+$/;
}
