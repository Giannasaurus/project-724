namespace BMIS;

public static class Utils {
    public static string RankNum(int n) {
        int abs = Math.Abs(n);
        
        if (abs == 1) { return n + "st"; }
        else if (abs == 2) { return n + "nd"; }
        else if (abs == 3) { return n + "rd"; }
        else { return n + "th"; }
    }
}
