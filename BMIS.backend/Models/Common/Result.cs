using System.Net;

namespace BMIS;

public record Result<T>(
    bool isSuccess,
    T value,
    string message,
    HttpStatusCode code
);
