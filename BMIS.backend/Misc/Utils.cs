namespace BMIS;

public static class Utils {
    public static string RankNum(int n) {
        int abs = Math.Abs(n);
        
        if (abs == 1) { return n + "st"; }
        else if (abs == 2) { return n + "nd"; }
        else if (abs == 3) { return n + "rd"; }
        else { return n + "th"; }
    }


    /*
     *  Definition:
     *      Checks how similar (2) set of strings are
     *      
     *      Formula:
     *          cosine similarity = dot(A, B) / (l2_norm(A) * l2_norm(B))
     *
     *
     *      set of strings <- a string with multiple words separated by spaces
     *
     */
    private static double GetCosineSim(string a, string b) {
        Dictionary<string, int> vocabulary = new Dictionary<string, int>();

        string[] wordsA = a.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            .Select(s => s.Trim().Trim(',').ToLower())
                            .ToArray();

        string[] wordsB = b.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            .Select(s => s.Trim().Trim(',').ToLower())
                            .ToArray();
        
        string[] allWords = wordsA.Concat(wordsB).ToArray();

        int index = 0;
        foreach(string s in allWords) {
            if(!vocabulary.ContainsKey(s)) {
                vocabulary.Add(s, index);
                index++;
            }
        }
       
        int[] A = new int[index];
        int[] B = new int[index];
        
        foreach(string s in wordsA){
            A[vocabulary[s]] += 1; 
        }
        
        foreach(string s in wordsB){
            B[vocabulary[s]] += 1; 
        }
        
        double dotp = 0; 
        double normA = 0;
        double normB = 0;

        for(int i = 0; i < index; i++) {
            dotp += A[i] * B[i]; 
            normA += A[i] * A[i];
            normB += B[i] * B[i];
        }

        normA = Math.Sqrt(normA);
        normB = Math.Sqrt(normB);
        
        return dotp / (normA * normB);
    }
    
    /* 
     * TODO: add definition
     *
     */
    public static double GetJaroWinklerDis(string a, string b) {
        a = a.Trim(new char[]{',', ' '}).ToLower();    
        b = b.Trim(new char[]{',', ' '}).ToLower();    

        int searchDis = Math.Min((int)Math.Floor(Math.Max(a.Length, b.Length) / 2.0) - 1, 4);
        
        bool[] aflag = new bool[a.Length];
        bool[] bflag = new bool[b.Length];
        
        double common = 0;
        double transp = 0;

        int i = 0;
        while(i < a.Length){
            int lowLim = Math.Max(0, i - searchDis);
            int uppLim = Math.Min(i + searchDis + 1, b.Length);
            for(int k = lowLim; k < uppLim; k++) {
                if(!bflag[k] && a[i] == b[k]) {
                    common += 1;
                    aflag[i] = true;
                    bflag[k] = true;
                    break;
                }
            }

            i++;
        }

        if(common == 0) {
            return 0;
        }

        int l = 0;
        for(int j = 0; j < a.Length; j++) {
            if(aflag[j]) {
                while(bflag[l] == false) {
                    l++;
                }

                transp += a[j] != b[l] ? 0.5 : 0;
                l++;
            }
        }


        double f1 = common / a.Length;
        double f2 = common / b.Length;
        double f3 = (common - transp) / common;
        double jaro = (f1 + f2 + f3) / 3.0;
        
        if(jaro < 0.7) {
            return jaro ;
        }

        double pref = 0;
        int maxPref = Math.Min(Math.Min(a.Length, b.Length), 4);

        i = 0;
        while(i < maxPref && a[i] == b[i]) {
            pref++;
            i++;
        }

        double winkler = jaro + (pref * 0.1 * (1.0 - jaro));  

        return winkler ;
    }

    public static List<List<T>> GetPermutations<T>(T[] options) {
        void Permutate(List<List<T>> results, List<T> curr, T[] options, HashSet<T> added) {
            if(curr.Count >= options.Length) {
                // WARNING:
                //  we need to do this because only the reference is passed
                //  when a list is added to results
                //  if that list is modified the one inside results is also modified
                //  thats why we have to add the copy not the list itself
                List<T> copy = new(curr);
                results.Add(copy);
            }

            foreach(var o in options) {
                if(added.Contains(o)) {
                    continue;
                }

                curr.Add(o);
                added.Add(o);

                Permutate(results, curr, options, added);
                
                curr.Remove(o);
                added.Remove(o);
            }
        }

        List<List<T>> results = new(); 
        foreach(var o in options) {
            List<T> curr = new();
            HashSet<T> added = new();

            curr.Add(o);
            added.Add(o);

            Permutate(results, curr, options, added);
        }

        return results;    
    }


    /*
     * Parameters:
     *  list  = items to paginize
     *  index = what page to view
     *  size  = number of items per page
     *  
     * Returns:
     *  items FROM list with index of [(index - 1) * size] TO [index * size]
     *
     *
     */
    public static List<T> PaginizeList<T>(List<T> list, int index, int size) {
        return list.GetRange(Math.Min((index - 1), list.Count) * size, Math.Min(index * size, list.Count));
    }

    public static List<T> GetListRange<T>(List<T> list, int? start, int? end) { 
        int count = list.Count;
        int nstart = start == null ? 0 : Math.Min((int)start, count);
        int nend = end == null ? count : Math.Min((int)end, count);

        return list.GetRange(nstart, nend);
    }
}
