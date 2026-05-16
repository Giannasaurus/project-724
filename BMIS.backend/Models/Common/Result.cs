namespace BMIS;

public static class Result {
    public static Result<T> Success<T>(T value) => value;
    public static Result<T> Failed<T>(ResultStatus code) => code;
}

public record Result<T>(
    bool isSuccess,
    T? value,
    string message,
    ResultStatus code
) {
    // public static Result<T> Success(T value, string message) => new Result<T>(true, value, message, ResultStatus.Ok);
    // public static Result<T> Failed(ResultStatus code, string message) => new Result<T>(false, default, message, code);

    public static implicit operator Result<T>(T value) => new(true, value, "success", ResultStatus.Ok);
    public static implicit operator Result<T>(ResultStatus code) => new(false, default, "failed", code);
}
