import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

const useDebounceSearch = (searchFn, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = debounce(async (term) => {
    if (!term) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await searchFn(term);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, delay);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  return { searchTerm, setSearchTerm, results, isLoading };
};

export default useDebounceSearch;