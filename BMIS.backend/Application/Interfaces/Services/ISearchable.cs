namespace BMIS.Application.Interfaces;

public interface ISearchable {
    double GetSimilarityScore(string reference, string candidate);
}
