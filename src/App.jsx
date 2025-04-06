import { useState, useEffect } from "react";
import Search from "./components/Search";
import Loading from "./components/Loading";
import MovieCard from "./components/MovieCard";
import { updateSearchCount, getTrendingMovies } from "./appwrite";

const API_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [movieList, setMovieList] = useState([]);
  const [trendingMoviesList, setTrendingMoviesList] = useState([]);
  
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
            query
          )}&sort_by=popularity.desc`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error("Failed to fetch movies.");
      }
      const data = await response.json();
      if (data.Results === "False") {
        setErrorMessage(
          data.Error || "Failed to fetch movies. Please try again later."
        );
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        const movie = data.results[0];
        await updateSearchCount(query, movie);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setErrorMessage("Failed to fetch movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const trendingMovies = await getTrendingMovies();
      setTrendingMoviesList(trendingMovies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    }
  }

  // Debounce the search term to avoid excessive API calls
  // by waiting for 500ms after the user stops typing

  // 1. searchTerm is updated immediately when the user types.
  useEffect(() => {
    // 2. useEffect sets a timeout to update debouncedTerm after 500ms.
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      // 3. If the user types again before 500ms, clearTimeout cancels the previous one.
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // 4. useEffect watches debouncedTerm and performs the API call only after the debounce delay.
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        {trendingMoviesList.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMoviesList.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="all-movies">
          <h2>All Movies</h2>
          {isLoading ? (
            <Loading />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;