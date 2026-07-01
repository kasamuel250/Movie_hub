<template>
  <div id="app" class="app-container">
    <div class="space-bg">
      <div v-for="(style, n) in starStyles" :key="'star' + n" class="star" :style="style"></div>
      <div v-for="(style, n) in cometStyles" :key="'comet' + n" class="shooting-star" :style="style"></div>
      <div v-for="(style, n) in nebulaStyles" :key="'nebula' + n" class="nebula-particle" :style="style"></div>
      <div v-for="(style, n) in planetStyles" :key="'planet' + n" class="planet-orbit" :style="style"></div>
      <div v-for="(style, n) in satelliteStyles" :key="'sat' + n" class="satellite" :style="style"></div>
      <div class="plasma p-1"></div>
      <div class="plasma p-2"></div>
      <div class="plasma p-3"></div>
    </div>

    <header class="main-header">
      <div class="header-inner">
        <div class="logo-group" @click="resetHome" @mousemove="moveLogo" @mouseleave="resetLogo" :style="logoTransform">
          <h1 class="chameleon-name">Ka_samuel250 <span>Flims_store</span></h1>
        </div>
        <nav class="nav-pills">
          <button class="pill" :class="{ active: currentPageName === 'home' }" @click="resetHome"><span><i class="fas fa-film"></i></span> Theater</button>
          <button v-if="isAuthenticated" class="pill" @click="setPage('profile')"><span><i class="fas fa-user"></i></span> Profile</button>
          <button v-if="isAuthenticated" class="pill" @click="setPage('watchlists')"><span><i class="fas fa-clipboard-list"></i></span> Lists</button>
          <button v-if="isAdmin" class="pill" @click="setPage('admin')"><span><i class="fas fa-cog"></i></span> Admin</button>
          <button v-if="isAuthenticated" class="pill" @click="handleLogout"><span><i class="fas fa-right-from-bracket"></i></span> Logout</button>
          <button v-else class="pill" :class="{ active: currentPageName === 'login' }" @click="setPage('login')"><span><i class="fas fa-key"></i></span> {{ isRegister ? 'Register' : 'Login' }}</button>
          <button class="pill" :class="{ active: currentPageName === 'contact-admin' }" @click="setPage('contact-admin')"><span><i class="fas fa-envelope"></i></span> Contact Admin</button>
          <button class="pill" :class="{ active: currentPageName === 'contact' }" @click="setPage('contact')"><span><i class="fas fa-mobile-screen-button"></i></span> Connect</button>
        </nav>
      </div>
    </header>

    <main class="content-wrapper">
      <section v-if="currentPageName === 'home' && !trailerUrl && !fullMovieUrl" class="hero-section">
        <div class="hero-copy">
          <div class="hero-heading-group">
            <p class="hero-kicker">Trending now</p>
            <h2 class="hero-title">Explore movies and series in a galaxy-style experience</h2>
            <p class="hero-subtitle">Watch trailers, open the player, and browse with smooth infinite scrolling.</p>
          </div>
          <div class="hero-description-group">
            <p class="hero-description">Dive into the freshest blockbusters, top-rated series, and curated picks from across the cinematic galaxy. Tap WATCH NOW to open the movie in a new tab for the best viewing experience.</p>
            <div class="hero-meta">
              <span><i class="fas fa-rocket"></i> Latest releases</span>
              <span><i class="fas fa-film"></i> Curated trending picks</span>
              <span><i class="fas fa-star"></i> Infinite scroll discovery</span>
            </div>
          </div>
        </div>

        <div class="hero-carousel" v-if="heroMovies.length">
          <div class="hero-carousel-track">
            <div
              v-for="(movie, index) in [...heroMovies, ...heroMovies]"
              :key="movie.id + '-' + index"
              class="carousel-card"
            >
              <span class="trend-badge">Trending now</span>
              <img
                v-if="movie.poster_path"
                :src="'https://image.tmdb.org/t/p/w500' + movie.poster_path"
                :alt="movie.title || movie.name"
              />
              <div v-else class="no-poster hero-no-poster">{{ movie.title || movie.name }}</div>
              <div class="hero-overlay">
                <button class="btn-watch-gradient hero-watch-btn" @click.stop="playFullMovie(movie)"><i class="fas fa-play"></i> WATCH NOW</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="currentPageName === 'home' && !trailerUrl && !fullMovieUrl" class="search-section">
        <div class="search-container">
          <div class="mode-switcher">
            <button class="mode-btn" :class="{ active: mode === 'movie' }" @click="toggleMode('movie')"><i class="fas fa-video"></i> Movies</button>
            <button class="mode-btn" :class="{ active: mode === 'tv' }" @click="toggleMode('tv')"><i class="fas fa-tv"></i> TV Series</button>
          </div>
          <div class="search-glow-box">
            <input v-model="searchQuery" placeholder="Search the galaxy..." @input="debouncedSearch" @keyup.enter="handleSearch(true)" />
            <button @click="handleSearch(true)" class="search-action-btn"><i class="fas fa-rocket"></i> EXPLORE</button>
          </div>
          <div class="advanced-filters">
            <select v-model="advancedFilters.genre" class="glow-input">
              <option v-for="genre in genreOptions" :key="genre.id" :value="genre.id">{{ genre.name }}</option>
            </select>
            <input v-model="advancedFilters.year" type="number" placeholder="Year" class="glow-input" />
            <input v-model="advancedFilters.rating" type="number" step="0.1" placeholder="Min Rating" class="glow-input" />
            <select v-model="advancedFilters.sortBy" class="glow-input">
              <option value="popularity.desc">Popularity</option>
              <option value="release_date.desc">Release Date</option>
              <option value="vote_average.desc">Rating</option>
            </select>
            <button @click="handleAdvancedSearch" class="search-action-btn"><i class="fas fa-search"></i> Advanced Search</button>
          </div>
        </div>
      </section>

      <div v-if="currentPageName === 'home' && !trailerUrl && !fullMovieUrl" class="movies-section">
        <div class="movie-grid">
          <template v-if="loading && movies.length === 0">
            <div v-for="n in 8" :key="n" class="movie-card skeleton-card">
              <div class="skeleton-poster"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </template>
          <template v-else>
            <div
              v-for="item in movies"
              :key="item.id"
              class="movie-card"
              :style="{ '--rating': `${item.vote_average || 0}%` }"
              @mouseenter="setHoverGenre(item.genre_ids || [])"
              @mouseleave="setHoverGenre()"
              @click="openDetails(item)"
            >
              <div class="poster-box">
                <div class="movie-card-actions">
                  <button class="card-action-btn favorite" @click.stop="addToFavorites(item)" title="Favorite"><i class="fas fa-heart"></i></button>
                  <button class="card-action-btn watchlist" @click.stop="addToWatchlist(item)" title="Save to Watchlist"><i class="fas fa-bookmark"></i></button>
                </div>
                <img
                  v-if="item.poster_path"
                  :src="'https://image.tmdb.org/t/p/w500' + item.poster_path"
                  :alt="item.title || item.name"
                  loading="lazy"
                >
                <div v-else class="no-poster"><span>{{ item.title || item.name }}</span></div>
              </div>

              <div class="card-badge"><i class="fas fa-star" style="color:#ffc107;font-size:.7rem"></i> {{ item.vote_average ? item.vote_average.toFixed(1) : 'N/A' }}</div>

              <div class="overlay">
                <div class="overlay-content">
                  <h4 class="m-title">{{ item.title || item.name }}</h4>
                  <p class="m-info">{{ (item.release_date || item.first_air_date || '').split('-')[0] }}</p>
                  <div class="btns">
                    <button class="btn-watch-gradient" @click.stop="playFullMovie(item)"><i class="fas fa-play"></i> WATCH NOW</button>
                    <button class="btn-trailer-red" @click.stop="playTrailer(item)"><i class="fas fa-film"></i> TRAILER</button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div ref="scrollTrigger" class="loader-zone">
          <div v-if="loading" class="orbit-spinner">
            <div class="orbit"></div>
            <div class="orbit"></div>
            <div class="orbit"></div>
          </div>
          <p v-if="!loading && movies.length === 0" class="no-results">The sector is empty. Try a different search.</p>
        </div>
      </div>

      <div v-if="trailerUrl || fullMovieUrl || showCinemaHall" class="cinema-hall-container">
        <div class="cinema-header">
          <div class="playing-info">
            <span class="live-tag"><i class="fas fa-circle" style="color:#ff0044;font-size:.6rem"></i> LIVE</span>
            <h3>{{ currentMovieTitle }}</h3>
          </div>
          <div class="cinema-actions">
            <button class="exit-hall-btn" @click="closePlayer">✕ EXIT</button>
          </div>
        </div>
        <div class="video-stage" v-if="trailerUrl">
          <div class="video-wrapper">
            <iframe
              :src="trailerUrl"
              frameborder="0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              class="trailer-iframe"
              loading="lazy"
              allowfullscreen
            ></iframe>
          </div>
          <div class="trailer-actions" v-if="currentMovieYoutubeUrl">
            <button class="youtube-btn" @click="openYoutubeTrailer" title="Watch on YouTube">
              <i class="fab fa-youtube"></i> Watch on YouTube
            </button>
          </div>
          <div v-if="currentMovieFallbackSources.length" class="source-switcher">
            <span class="source-label">Source not loading?</span>
            <button
              v-for="(src, i) in currentMovieFallbackSources"
              :key="i"
              class="source-switch-btn"
              @click="switchTrailerSource(src)"
            >
              <i class="fas fa-rotate"></i> Source {{ i + 1 }}
            </button>
          </div>
        </div>
        <div v-if="!trailerUrl && !fullMovieUrl && showCinemaHall" class="video-stage cinema-info-stage">
          <div class="cinema-info-content">
            <div class="cinema-playing-icon"><i class="fas fa-film"></i></div>
            <h2>{{ currentMovieTitle }}</h2>
            <p class="cinema-info-sub">Now playing in a new tab. Comments below <i class="fas fa-arrow-down"></i></p>
            <div class="cinema-info-actions">
              <button class="btn-watch-gradient" @click="reopenMovie"><i class="fas fa-redo"></i> REOPEN</button>
              <button v-if="currentMovieYoutubeUrl" class="youtube-btn" @click="openYoutubeTrailer"><i class="fab fa-youtube"></i> Watch on YouTube</button>
            </div>
          </div>
        </div>

        <div class="comment-section">
          <h3 class="comment-title"><i class="fas fa-comments"></i> Comments</h3>

          <form class="comment-form" @submit.prevent="submitComment">
            <div v-if="!isAuthenticated" class="comment-login-prompt">
              <p>Login required to post a comment. <button type="button" class="login-link" @click="setPage('login')">Go to login</button></p>
            </div>
            <div class="input-group">
              <input
                v-model="commentName"
                type="text"
                placeholder="Your name"
                required
                class="glow-input"
                :disabled="!isAuthenticated"
              />
              <div class="input-glow"></div>
            </div>

            <div class="input-group">
              <textarea
                v-model="commentText"
                rows="4"
                placeholder="Write your comment..."
                required
                class="glow-input comment-textarea"
                :disabled="!isAuthenticated"
              ></textarea>
              <div class="input-glow"></div>
            </div>

            <button type="submit" class="auth-btn primary" :disabled="commentLoading || !isAuthenticated">
              <button type="submit" class="auth-btn primary" :disabled="commentLoading">
                <i v-if="commentLoading" class="fas fa-spinner fa-pulse"></i>
                <i v-else class="fas fa-pen"></i>
                {{ commentLoading ? ' SENDING...' : ' POST COMMENT' }}
              </button>
            </button>
          </form>

          <p v-if="commentSuccess" class="success-message">Comment posted successfully!</p>
          <p v-if="commentError" class="error-message">{{ commentError }}</p>

          <div class="comment-list" v-if="comments.length">
            <div v-for="(comment, index) in comments" :key="index" class="comment-item">
              <h4>{{ comment.name || comment.userName }}</h4>
              <p>{{ comment.text }}</p>
              <small class="comment-date">{{ comment.date }}</small>
            </div>
          </div>

          <p v-else class="no-results">No comments yet. Be the first to comment.</p>
        </div>
      </div>

      <div v-if="currentPageName === 'login'" class="auth-container">
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="tab-btn" :class="{ active: !isRegister }" @click="isRegister = false"><i class="fas fa-key"></i> Login</button>
            <button class="tab-btn" :class="{ active: isRegister }" @click="isRegister = true"><i class="fas fa-rocket"></i> Register</button>
          </div>

          <div v-if="!isRegister" class="auth-forms">
            <form @submit.prevent="handleLogin" class="auth-form">
              <div class="input-group">
                <input v-model="loginEmail" type="text" placeholder="Email or Username" required class="glow-input" />
                <div class="input-glow"></div>
              </div>
              <div class="input-group password-group">
                <input v-model="loginPassword" :type="showLoginPassword ? 'text' : 'password'" placeholder="Password" required class="glow-input" />
                <button type="button" class="password-toggle" @click="showLoginPassword = !showLoginPassword">
                  {{ showLoginPassword ? 'Hide' : 'Show' }}
                </button>
                <div class="input-glow"></div>
              </div>
              <button type="submit" class="auth-btn primary" :disabled="loginLoading">
                <i v-if="loginLoading" class="fas fa-spinner fa-pulse"></i>
                <i v-else class="fas fa-rocket"></i>
                {{ loginLoading ? ' ENTERING...' : ' LOGIN' }}
              </button>
            </form>
            <p class="forgot-password"><button type="button" class="forgot-link" @click="currentPageName = 'forgot'">Forgot Password?</button></p>
          </div>

          <div v-else class="auth-forms">
            <form @submit.prevent="handleRegister" class="auth-form">
              <div class="input-group"><input v-model="registerEmail" type="email" placeholder="Email" required class="glow-input" /><div class="input-glow"></div></div>
              <div class="input-group"><input v-model="registerPassword" type="password" placeholder="Password" required class="glow-input" /><div class="input-glow"></div></div>
              <div class="input-group"><input v-model="registerConfirmPassword" type="password" placeholder="Confirm Password" required class="glow-input" /><div class="input-glow"></div></div>
              <button type="submit" class="auth-btn primary" :disabled="registerLoading">
                <i v-if="registerLoading" class="fas fa-spinner fa-pulse"></i>
                <i v-else class="fas fa-star"></i>
                {{ registerLoading ? ' CREATING...' : ' REGISTER' }}
              </button>
            </form>
          </div>

          <div class="auth-footer">
            <p v-if="loginError" class="error-message">{{ loginError }}</p>
            <p v-if="registerError" class="error-message">{{ registerError }}</p>
          </div>
        </div>
      </div>

      <div v-if="currentPageName === 'forgot'" class="auth-container">
        <div class="auth-card">
          <button class="back-btn" @click="setPage('login')">← Back to Login</button>
          <div class="auth-header">
            <h2 class="glow-text">Reset Password</h2>
            <p>Enter your email and we'll send you a reset link</p>
          </div>
          <form @submit.prevent="handleForgotPassword" class="auth-form">
            <div class="input-group"><input v-model="forgotEmail" type="email" placeholder="Your Email" required class="glow-input" /><div class="input-glow"></div></div>
            <button type="submit" class="auth-btn primary" :disabled="forgotLoading">
              <i v-if="forgotLoading" class="fas fa-spinner fa-pulse"></i>
              <i v-else class="fas fa-envelope"></i>
              {{ forgotLoading ? ' SENDING...' : ' SEND RESET LINK' }}
            </button>
          </form>
          <p v-if="resetSuccess" class="success-message">Check your email for the reset link!</p>
        </div>
      </div>

      <div v-if="currentPageName === 'contact'" class="new-contact-container">
        <div class="contact-hero">
          <h2 class="hero-title">Connect with Ka_samuel@250</h2>
          <p class="hero-subtitle">Reach out across the galaxy</p>
        </div>

        <div class="contact-orbit-container" @mousemove="updateContactOrbit" :style="contactOrbitStyle">
          <div class="contact-orbit-item email-orbit" @click="copyEmail">
            <div class="contact-item email">
              <div class="contact-icon"><i class="fas fa-envelope"></i></div>
              <h3>Email</h3>
              <p>kasamuel71@gmail.com</p>
            </div>
          </div>
          <div class="contact-orbit-item phone-orbit" @click="copyPhone">
            <div class="orbit-ring"></div>
            <div class="contact-item phone">
              <div class="contact-icon"><i class="fas fa-phone"></i></div>
              <h3>Phone</h3>
              <p>0723112258</p>
            </div>
          </div>
          <div class="contact-orbit-item whatsapp-orbit" @click="openWhatsApp">
            <div class="orbit-ring"></div>
            <div class="contact-item whatsapp">
              <div class="contact-icon"><i class="fab fa-whatsapp"></i></div>
              <h3>WhatsApp</h3>
              <p>+250 787 949 343</p>
            </div>
          </div>
          <div class="contact-orbit-item instagram-orbit" @click="openInstagram">
            <div class="orbit-ring"></div>
            <div class="contact-item instagram">
              <div class="contact-icon"><i class="fab fa-instagram"></i></div>
              <h3>Instagram</h3>
              <p>@ka_samuel250</p>
            </div>
          </div>
        </div>

        <button class="back-btn" @click="resetHome"><i class="fas fa-arrow-left"></i> BACK TO BASE</button>
      </div>

      <!-- Profile Page -->
      <div v-if="currentPageName === 'profile'" class="profile-container">
        <div v-if="!isAuthenticated" class="login-overlay">
          <div class="login-splash">
            <div class="splash-stars">
              <div v-for="(style, n) in splashStars" :key="'splash-star' + n" class="splash-star" :style="style"></div>
            </div>
            <div class="splash-content">
              <h1 class="splash-title">Join the Galaxy</h1>
              <p class="splash-subtitle">Sign in to access your profile, watch history, favorites, and personalized recommendations.</p>
              <button class="splash-btn" @click="setPage('login')"><i class="fas fa-rocket"></i> LOGIN NOW</button>
              <button class="splash-secondary" @click="resetHome"><i class="fas fa-arrow-left"></i> BACK TO THEATER</button>
            </div>
          </div>
        </div>
        <div v-else class="profile-card">
          <h2 class="glow-text">User Profile</h2>
          <form @submit.prevent="updateProfile" class="profile-form">
            <div class="input-group">
              <input v-model="profile.name" type="text" placeholder="Name" class="glow-input" />
            </div>
            <div class="input-group">
              <textarea v-model="profile.bio" rows="3" placeholder="Bio" class="glow-input"></textarea>
            </div>
            <div class="input-group">
              <label for="theme-select" class="theme-label">Theme:</label>
              <select id="theme-select" v-model="currentTheme" @change="changeTheme" class="glow-input">
                <option value="default">Default Galaxy</option>
                <option value="dark">Deep Space</option>
                <option value="neon">Neon Cyber</option>
                <option value="retro">Retro Sci-Fi</option>
              </select>
            </div>
            <button type="submit" class="auth-btn primary">Update Profile</button>
          </form>
          <div class="profile-sections">
            <div class="profile-section">
              <h3>Watch History</h3>
              <div class="history-list">
                <div v-for="item in watchHistory" :key="item.movieId" class="history-item">
                  {{ item.movieTitle }} - {{ new Date(item.watchedAt).toLocaleDateString() }}
                </div>
              </div>
            </div>
            <div class="profile-section">
              <h3>Favorites</h3>
              <div class="favorites-grid">
                <div v-for="fav in favorites" :key="fav.movieId" class="fav-card" @click="openMovieDetails(fav)">
                  <img v-if="fav.posterPath" :src="'https://image.tmdb.org/t/p/w200' + fav.posterPath" :alt="fav.movieTitle" />
                  <div v-else class="no-poster">{{ fav.movieTitle }}</div>
                </div>
              </div>
            </div>
            <div class="profile-section">
              <h3>Recommendations</h3>
              <div class="rec-grid">
                <div v-for="rec in recommendations" :key="rec.id" class="rec-card" @click="openMovieDetails(rec)">
                  <img v-if="rec.poster_path" :src="'https://image.tmdb.org/t/p/w200' + rec.poster_path" :alt="rec.title" />
                  <div v-else class="no-poster">{{ rec.title }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="back-btn" @click="resetHome"><i class="fas fa-arrow-left"></i> BACK TO THEATER</button>
      </div>

      <!-- Watchlists Page -->
      <div v-if="currentPageName === 'watchlists'" class="watchlists-container">
        <div v-if="!isAuthenticated" class="login-overlay">
          <div class="login-splash">
            <div class="splash-stars">
              <div v-for="(style, n) in splashStars" :key="'splash-star' + n" class="splash-star" :style="style"></div>
            </div>
            <div class="splash-content">
              <h1 class="splash-title">Create Your Lists</h1>
              <p class="splash-subtitle">Login to build and manage your personal watchlists. Save movies for later and never miss a favorite.</p>
              <button class="splash-btn" @click="setPage('login')"><i class="fas fa-rocket"></i> LOGIN NOW</button>
              <button class="splash-secondary" @click="resetHome"><i class="fas fa-arrow-left"></i> BACK TO THEATER</button>
            </div>
          </div>
        </div>
        <div v-else class="watchlists-card">
          <h2 class="glow-text">My Watchlists</h2>
          <form @submit.prevent="createWatchlist" class="watchlist-form">
            <input v-model="newListName" type="text" placeholder="New list name" required class="glow-input" />
            <button type="submit" class="auth-btn primary">Create List</button>
          </form>
          <div class="watchlists-list">
            <div v-for="list in watchlists" :key="list.id" class="watchlist-item">
              <h3>{{ list.name }}</h3>
              <div class="list-movies">
                <div v-for="movie in list.movies" :key="movie.movieId" class="list-movie" @click="openMovieDetails(movie)">
                  <img v-if="movie.posterPath" :src="'https://image.tmdb.org/t/p/w150' + movie.posterPath" :alt="movie.movieTitle" />
                  <div v-else class="no-poster-small">{{ movie.movieTitle }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="back-btn" @click="resetHome"><i class="fas fa-arrow-left"></i> BACK TO THEATER</button>
      </div>

      <!-- Movie Details Page -->
      <div v-if="currentPageName === 'movie-details'" class="movie-details-container">
        <div v-if="movieDetails" class="movie-details-card">
          <div class="movie-header">
            <img v-if="movieDetails.poster_path" :src="'https://image.tmdb.org/t/p/w300' + movieDetails.poster_path" :alt="movieDetails.title" class="movie-poster" />
            <div class="movie-info">
              <h2>{{ movieDetails.title }}</h2>
              <p>{{ movieDetails.overview }}</p>
              <p>Release: {{ movieDetails.release_date }}</p>
              <p>Rating: {{ movieDetails.vote_average }}/10</p>
              <div class="details-actions">
                <button @click="playFullMovie(movieDetails)" class="btn-watch-gradient"><i class="fas fa-play"></i> WATCH NOW</button>
                <button @click="playTrailer(movieDetails)" class="btn-trailer-red"><i class="fas fa-film"></i> TRAILER</button>
                <button @click="addToFavorites(movieDetails)" class="btn-trailer-red"><i class="fas fa-heart"></i> Favorite</button>
              </div>
              <div class="download-options">
                <h4>Download Options</h4>
                <div class="download-buttons">
                  <button @click="downloadPoster(movieDetails)" class="download-option"><i class="fas fa-image"></i> Poster</button>
                  <button @click="downloadTrailer(movieDetails)" class="download-option"><i class="fas fa-video"></i> Trailer</button>
                  <button @click="cacheForOffline(movieDetails)" class="download-option"><i class="fas fa-database"></i> Cache Offline</button>
                </div>
                <p class="download-note">Note: Full movie downloads require browser extensions or third-party tools. Trailers and posters can be downloaded directly.</p>
              </div>
            </div>
          </div>
          <div class="cast-section">
            <h3>Cast</h3>
            <div class="cast-list">
              <div v-for="cast in movieDetails.cast" :key="cast.id" class="cast-item">
                <img v-if="cast.profile_path" :src="'https://image.tmdb.org/t/p/w185' + cast.profile_path" :alt="cast.name" />
                <div>{{ cast.name }} as {{ cast.character }}</div>
              </div>
            </div>
          </div>
          <div class="similar-section">
            <h3>Similar Movies</h3>
            <div class="similar-grid">
              <div v-for="sim in similarMovies" :key="sim.id" class="similar-card" @click="openMovieDetails(sim)">
                <img v-if="sim.poster_path" :src="'https://image.tmdb.org/t/p/w200' + sim.poster_path" :alt="sim.title" />
                <div v-else class="no-poster">{{ sim.title }}</div>
              </div>
            </div>
          </div>
          <div class="reviews-section">
            <h3>Reviews</h3>
            <div class="reviews-list">
              <div v-for="review in movieReviews" :key="review.id" class="review-item">
                <h4>{{ review.author }}</h4>
                <p>{{ review.content }}</p>
              </div>
            </div>
          </div>
        </div>
        <button class="back-btn" @click="setPage('home')"><i class="fas fa-arrow-left"></i> BACK TO THEATER</button>
      </div>

      <!-- Admin Panel -->
      <div v-if="currentPageName === 'admin'" class="admin-panel">
        <!-- Admin Login Gate -->
        <div v-if="!isAdminAuthenticated" class="admin-login-gate">
          <div class="admin-lock-icon"><i class="fas fa-lock"></i></div>
          <h2>Admin Control Center</h2>
          <p>Enter administrator credentials to access the dashboard</p>
          <form @submit.prevent="handleAdminLogin" class="admin-login-form">
            <div class="input-group">
              <input v-model="adminLoginUsername" type="text" placeholder="Username" class="glow-input" required />
            </div>
            <div class="input-group">
              <input v-model="adminLoginPassword" type="password" placeholder="Password" class="glow-input" required />
            </div>
            <p v-if="adminLoginError" class="error-message">{{ adminLoginError }}</p>
            <button type="submit" class="auth-btn primary admin-login-btn"><i class="fas fa-key"></i> ACCESS DASHBOARD</button>
          </form>
        </div>

        <!-- Admin Dashboard -->
        <div v-else class="admin-dashboard">
          <div class="admin-header">
            <div class="admin-header-left">
              <h2><i class="fas fa-cog"></i> Admin Control Center</h2>
              <p>Super control over all platform activities</p>
            </div>
            <div class="admin-header-right">
              <span class="admin-badge"><i class="fas fa-shield-alt"></i> SUPER ADMIN</span>
              <button class="admin-logout-btn" @click="handleAdminLogout"><i class="fas fa-right-from-bracket"></i> Logout</button>
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="admin-metrics">
            <div class="admin-card">
              <div class="admin-card-icon"><i class="fas fa-users"></i></div>
              <h3>Total Users</h3>
              <p class="admin-stat-number">{{ adminStats.totalUsers }}</p>
            </div>
            <div class="admin-card">
              <div class="admin-card-icon"><i class="fas fa-film"></i></div>
              <h3>Movie Views</h3>
              <p class="admin-stat-number">{{ adminStats.totalWatchRecords }}</p>
            </div>
            <div class="admin-card">
              <div class="admin-card-icon"><i class="fas fa-comments"></i></div>
              <h3>Total Comments</h3>
              <p class="admin-stat-number">{{ adminStats.totalComments || 0 }}</p>
            </div>
            <div class="admin-card">
              <div class="admin-card-icon"><i class="fas fa-envelope"></i></div>
              <h3>Messages</h3>
              <p class="admin-stat-number">{{ adminMessages.length }}</p>
            </div>
          </div>

          <!-- Admin Tabs -->
          <div class="admin-tabs">
            <button class="admin-tab" :class="{ active: adminActiveTab === 'users' }" @click="adminActiveTab = 'users'"><i class="fas fa-users"></i> Users</button>
            <button class="admin-tab" :class="{ active: adminActiveTab === 'comments' }" @click="adminActiveTab = 'comments'"><i class="fas fa-comments"></i> Comments</button>
            <button class="admin-tab" :class="{ active: adminActiveTab === 'messages' }" @click="adminActiveTab = 'messages'"><i class="fas fa-envelope"></i> Messages</button>
            <button class="admin-tab" :class="{ active: adminActiveTab === 'movies' }" @click="adminActiveTab = 'movies'"><i class="fas fa-film"></i> Movies</button>
            <button class="admin-tab" :class="{ active: adminActiveTab === 'activity' }" @click="adminActiveTab = 'activity'"><i class="fas fa-chart-bar"></i> Activity</button>
          </div>

          <!-- Users Tab -->
          <div v-if="adminActiveTab === 'users'" class="admin-section">
            <h3><i class="fas fa-users"></i> User Management</h3>
            <div class="admin-search-bar">
              <input v-model="adminUserSearch" type="text" placeholder="Search users by email..." class="glow-input" />
            </div>
            <div v-if="filteredAdminUsers.length" class="admin-user-list">
              <div v-for="u in filteredAdminUsers" :key="u.id" class="admin-user-card">
                <div class="admin-user-info">
                  <div class="admin-user-avatar">{{ u.email.charAt(0).toUpperCase() }}</div>
                  <div>
                    <span class="admin-user-email">{{ u.email }}</span>
                    <span class="admin-user-date">Joined: {{ new Date(u.createdAt).toLocaleDateString() }}</span>
                  </div>
                </div>
                <div class="admin-user-actions">
                  <span class="admin-user-role" :class="u.role">{{ u.role || 'user' }}</span>
                  <button class="admin-action-btn view" @click="viewUserActivity(u)" title="View Activity"><i class="fas fa-chart-bar"></i></button>
                  <button class="admin-action-btn delete" @click="deleteAdminUser(u.id)" title="Remove User"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
            <div v-else class="admin-empty">No users found.</div>
          </div>

          <!-- Comments Tab -->
          <div v-if="adminActiveTab === 'comments'" class="admin-section">
            <h3><i class="fas fa-comments"></i> All Comments</h3>
            <div v-if="allComments.length" class="admin-comment-list">
              <div v-for="c in allComments" :key="c.id" class="admin-comment-card">
                <div class="admin-comment-header">
                  <strong>{{ c.userName }}</strong>
                  <span class="admin-comment-movie">on Movie #{{ c.movieId }}</span>
                  <small>{{ c.date }}</small>
                </div>
                <p>{{ c.text }}</p>
                <button class="admin-action-btn delete" @click="deleteAdminComment(c.id)"><i class="fas fa-trash"></i> Delete</button>
              </div>
            </div>
            <div v-else class="admin-empty">No comments found.</div>
          </div>

          <!-- Messages Tab -->
          <div v-if="adminActiveTab === 'messages'" class="admin-section">
            <h3><i class="fas fa-envelope"></i> User Messages</h3>
            <div v-if="adminMessages.length" class="admin-message-list">
              <div v-for="msg in adminMessages" :key="msg.id" class="admin-message-card" :class="{ unread: !msg.isRead }">
                <div class="admin-message-header">
                  <div class="admin-message-sender">
                    <strong>{{ msg.name || msg.email }}</strong>
                    <span class="admin-message-subject">{{ msg.subject }}</span>
                  </div>
                  <div class="admin-message-meta">
                    <small>{{ new Date(msg.createdAt).toLocaleString() }}</small>
                    <button class="admin-action-btn delete" @click="deleteAdminMessage(msg.id)"><i class="fas fa-trash"></i></button>
                  </div>
                </div>
                <p class="admin-message-body">{{ msg.message }}</p>
                <div class="admin-message-reply">
                  <input v-model="msg.replyText" type="text" placeholder="Type reply..." class="glow-input" />
                  <button class="admin-action-btn reply" @click="replyToMessage(msg)">Reply</button>
                </div>
              </div>
            </div>
            <div v-else class="admin-empty">No messages yet.</div>
          </div>

          <!-- Movies Tab -->
          <div v-if="adminActiveTab === 'movies'" class="admin-section">
            <h3><i class="fas fa-film"></i> Top Movie Views</h3>
            <div v-if="movieViews.length" class="movie-view-list">
              <div v-for="view in movieViews" :key="view.movieTitle" class="movie-view-item">
                <span class="movie-view-title">{{ view.movieTitle }}</span>
                <span class="movie-view-count">{{ view.views }} views</span>
              </div>
            </div>
            <div v-else class="admin-empty">No view data available yet.</div>
          </div>

          <!-- Activity Tab -->
          <div v-if="adminActiveTab === 'activity'" class="admin-section">
            <h3><i class="fas fa-chart-bar"></i> Recent Activity</h3>
            <div v-if="recentActivity.length" class="activity-list">
              <div v-for="act in recentActivity" :key="act.id" class="activity-item">
                <span class="activity-icon"><i class="fas fa-circle" :class="getActivityIcon(act.type)"></i></span>
                <div class="activity-detail">
                  <span>{{ act.description }}</span>
                  <small>{{ new Date(act.createdAt).toLocaleString() }}</small>
                </div>
              </div>
            </div>
            <div v-else class="admin-empty">No recent activity.</div>
          </div>

          <button class="back-btn" @click="resetHome"><i class="fas fa-arrow-left"></i> BACK TO THEATER</button>
        </div>
      </div>

      <!-- User Message to Admin -->
      <div v-if="currentPageName === 'contact-admin'" class="contact-admin-container">
        <div class="contact-admin-card">
          <h2><i class="fas fa-envelope"></i> Send Message to Admin</h2>
          <p>Have a question, suggestion, or issue? Send a message to the administrator.</p>
          <form @submit.prevent="sendAdminMessage" class="admin-message-form">
            <div class="input-group">
              <input v-model="adminMsgName" type="text" placeholder="Your Name" class="glow-input" required />
            </div>
            <div class="input-group">
              <input v-model="adminMsgEmail" type="email" placeholder="Your Email" class="glow-input" required />
            </div>
            <div class="input-group">
              <input v-model="adminMsgSubject" type="text" placeholder="Subject" class="glow-input" required />
            </div>
            <div class="input-group">
              <textarea v-model="adminMsgMessage" rows="5" placeholder="Your message..." class="glow-input" required></textarea>
            </div>
            <button type="submit" class="auth-btn primary" :disabled="adminMsgLoading">
              <i v-if="adminMsgLoading" class="fas fa-spinner fa-pulse"></i>
              <i v-else class="fas fa-paper-plane"></i>
              {{ adminMsgLoading ? ' SENDING...' : ' SEND MESSAGE' }}
            </button>
            <p v-if="adminMsgSuccess" class="success-message">Message sent successfully! Admin will respond soon.</p>
            <p v-if="adminMsgError" class="error-message">{{ adminMsgError }}</p>
          </form>
        </div>
        <button class="back-btn" @click="resetHome"><i class="fas fa-arrow-left"></i> BACK TO THEATER</button>
      </div>

      <!-- Watchlist Selection Modal -->
      <div v-if="showWatchlistModal" class="modal-overlay" @click="closeWatchlistModal">
        <div class="modal-content" @click.stop>
          <h3>Add to Watchlist</h3>
          <p>Select a list or create a new one for "{{ selectedMovieForList?.title || selectedMovieForList?.name }}"</p>
          <div class="watchlist-options">
            <div v-for="list in watchlists" :key="list.id" class="watchlist-option" @click="addToSpecificList(list)">
              {{ list.name }}
            </div>
            <div class="watchlist-option new-list" @click="showNewListInput = true">
              + Create New List
            </div>
          </div>
          <div v-if="showNewListInput" class="new-list-input">
            <input v-model="newListName" placeholder="List name" @keyup.enter="createAndAddToList" />
            <button @click="createAndAddToList">Create & Add</button>
          </div>
          <button class="modal-close" @click="closeWatchlistModal">Cancel</button>
        </div>
      </div>

      <!-- AI Chat Widget -->
      <div class="ai-chat-widget">
        <div v-if="!isChatOpen" class="chat-toggle" @click="toggleChat">
          <div class="chat-icon"><i class="fas fa-robot"></i></div>
        </div>
        <div v-else class="chat-window">
          <div class="chat-bg-particles">
            <div v-for="n in 10" :key="n" class="chat-particle" :style="{ animationDelay: `${n * 0.5}s` }"></div>
          </div>
          <div class="chat-header">
            <h3>AI Assistant</h3>
            <button class="chat-close" @click="toggleChat">×</button>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div v-for="(msg, index) in chatMessages" :key="index" :class="['chat-message', msg.role]">
              <div class="message-content">{{ msg.content }}</div>
            </div>
          </div>
          <div class="chat-input-area">
            <input
              v-model="chatInput"
              @keyup.enter="sendMessage"
              placeholder="Ask me anything..."
              class="chat-input"
              :disabled="isChatLoading"
            />
            <button @click="sendMessage" class="chat-send" :disabled="isChatLoading || !chatInput.trim()">
              <i v-if="isChatLoading" class="fas fa-spinner fa-pulse"></i>
              <i v-else class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer on every page -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Ka_samuel250 Flims_store</h4>
          <p>Explore the galaxy of movies and series in an immersive space-themed experience.</p>
        </div>
        <div class="footer-section">
          <h4>Features</h4>
          <ul>
            <li>Movie Trailers</li>
            <li>User Profiles</li>
            <li>Watchlists</li>
            <li>AI Assistant</li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Connect</h4>
          <p><a href="mailto:kasamuel71@gmail.com" class="footer-link"><i class="fas fa-envelope"></i> kasamuel71@gmail.com</a></p>
          <p><a href="tel:+250787949343" class="footer-link"><i class="fas fa-mobile-screen-button"></i> +250 787 949 343</a></p>
          <p><a href="https://instagram.com/ka_samuel250" target="_blank" rel="noopener noreferrer" class="footer-link"><i class="fab fa-instagram"></i> @ka_samuel250</a></p>
        </div>
        <div class="footer-section">
          <h4>Theme</h4>
          <select v-model="currentTheme" @change="changeTheme" class="footer-theme-select">
            <option value="default">Galaxy</option>
            <option value="dark">Deep Space</option>
            <option value="neon">Neon Cyber</option>
            <option value="retro">Retro Sci-Fi</option>
          </select>
        </div>
      </div>
      <div class="footer-cta-row">
        <div class="footer-cta-text">
          <p>Stay connected and keep exploring new movies every time you return.</p>
        </div>
        <div class="footer-cta-buttons">
          <a href="#" @click="resetHome" class="footer-cta-btn"><i class="fas fa-house"></i> Home</a>
          <a href="mailto:kasamuel71@gmail.com" class="footer-cta-btn">Contact</a>
          <a href="https://instagram.com/ka_samuel250" target="_blank" rel="noopener noreferrer" class="footer-cta-btn secondary">Follow</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Ka_samuel250 Flims_store. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnwexuyvbjcyggnmpbfp.supabase.co';
const supabaseAnonKey = 'sb_publishable_yTzl54l-ioSt9vo75Tuu4Q_tYgbNqQ6';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'e7db3a3c0e678db81b80238ab2bf0afa';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const movies = ref([]);
const heroMovies = ref([]);
const mode = ref('movie');
const searchQuery = ref('');
const currentPageName = ref('home');
const trailerUrl = ref(null);
const currentMovieTitle = ref('');
const fullMovieUrl = ref(null);
const currentMovieId = ref(null);
const currentMovieDownloadUrl = ref(null);
const showCinemaHall = ref(false);
const currentMovieFallbackSources = ref([]);
const currentMovieYoutubeUrl = ref('');
const page = ref(1);
const loading = ref(false);
const scrollTrigger = ref(null);
const chatMessagesRef = ref(null);

const isRegister = ref(false);
const loginEmail = ref('');
const loginPassword = ref('');
const showLoginPassword = ref(false);
const registerEmail = ref('');
const registerPassword = ref('');
const registerConfirmPassword = ref('');
const forgotEmail = ref('');
const loginLoading = ref(false);
const registerLoading = ref(false);
const forgotLoading = ref(false);
const resetSuccess = ref(false);
const loginError = ref('');
const registerError = ref('');

const user = ref(null);
const isAuthenticated = ref(false);
const logoX = ref(0);
const logoY = ref(0);
const logoScale = ref(1);

const commentName = ref('');
const commentText = ref('');
const comments = ref([]);
const commentLoading = ref(false);
const commentSuccess = ref(false);
const commentError = ref('');

// New refs for additional features
const profile = ref({ name: '', bio: '', avatar: null });
const watchHistory = ref([]);
const watchlists = ref([]);
const favorites = ref([]);
const recommendations = ref([]);
const selectedMovie = ref(null);
const movieDetails = ref(null);
const similarMovies = ref([]);
const movieReviews = ref([]);
const hoveredGenre = ref('');
const adminUsers = ref([]);
const adminStats = ref({ totalUsers: 0, totalWatchRecords: 0 });
const movieViews = ref([]);
const isAdmin = computed(() => user.value?.role === 'admin' || isAdminAuthenticated.value);
const searchTimeout = ref(null);
const genreOptions = ref([
  { id: '', name: 'All Genres', icon: 'fa-globe' },
  { id: 28, name: 'Action', icon: 'fa-bolt' },
  { id: 35, name: 'Comedy', icon: 'fa-face-smile' },
  { id: 18, name: 'Drama', icon: 'fa-masks-theater' },
  { id: 27, name: 'Horror', icon: 'fa-skull' },
  { id: 878, name: 'Sci-Fi', icon: 'fa-rocket' },
  { id: 10749, name: 'Romance', icon: 'fa-heart' },
  { id: 14, name: 'Fantasy', icon: 'fa-wand-magic-sparkles' }
]);
const genreNebulaHue = {
  Action: '6deg',
  Comedy: '50deg',
  Drama: '210deg',
  Horror: '330deg',
  'Sci-Fi': '190deg',
  Romance: '330deg',
  Fantasy: '280deg'
};
const movieGenres = {
  28: 'Action',
  35: 'Comedy',
  18: 'Drama',
  27: 'Horror',
  878: 'Sci-Fi',
  10749: 'Romance',
  14: 'Fantasy'
};
const advancedFilters = ref({ genre: '', year: '', rating: '', sortBy: 'popularity.desc' });
const newListName = ref('');
const currentTheme = ref(localStorage.getItem('theme') || 'default');

// AI Chat refs
const isChatOpen = ref(false);
const chatMessages = ref([]);
const chatInput = ref('');
const isChatLoading = ref(false);
const contactOrbitPosition = ref({ x: 0, y: 0 });
const contactOrbitStyle = computed(() => ({
  '--contact-x': `${contactOrbitPosition.value.x}`,
  '--contact-y': `${contactOrbitPosition.value.y}`
}));
const showWatchlistModal = ref(false);
const selectedMovieForList = ref(null);
const showNewListInput = ref(false);

// Admin refs
const isAdminAuthenticated = ref(false);
const adminLoginUsername = ref('');
const adminLoginPassword = ref('');
const adminLoginError = ref('');
const adminActiveTab = ref('users');
const adminUserSearch = ref('');
const allComments = ref([]);
const adminMessages = ref([]);
const recentActivity = ref([]);
const adminMsgName = ref('');
const adminMsgEmail = ref('');
const adminMsgSubject = ref('');
const adminMsgMessage = ref('');
const adminMsgLoading = ref(false);
const adminMsgSuccess = ref(false);
const adminMsgError = ref('');

const getActivityIcon = (type) => {
  switch(type) {
    case 'comment': return 'fa-comments';
    case 'login': return 'fa-key';
    case 'watch': return 'fa-film';
    default: return 'fa-envelope';
  }
};

let observer = null;

const logoTransform = computed(() => ({ transform: `translate(${logoX.value}px, ${logoY.value}px) scale(${logoScale.value})` }));

const initInfiniteScroll = async () => {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value && currentPageName.value === 'home') {
      loadData();
    }
  }, { rootMargin: '300px' });

  await nextTick();
  if (scrollTrigger.value) {
    observer.observe(scrollTrigger.value);
  }
};

watch(currentPageName, async (newPage) => {
  if (newPage === 'home') {
    await initInfiniteScroll();
  } else if (observer) {
    observer.disconnect();
  }
});

// Enhanced star styles with CSS custom properties
const starStyles = computed(() => Array.from({ length: 200 }, (_, n) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  opacity: Math.random() * 0.8 + 0.2,
  '--twinkle-duration': `${Math.random() * 3 + 1.5}s`,  // 1.5-4.5s
  '--twinkle-delay': `${Math.random() * 4}s`,
  animation: `twinkle var(--twinkle-duration) ease-in-out var(--twinkle-delay) infinite`
})));

const cometStyles = computed(() => Array.from({ length: 8 }, () => ({
  top: `${Math.random() * 30}%`,
  left: '-20%',
  animationDelay: `${Math.random() * 20}s`,
  animationDuration: `${Math.random() * 5 + 7}s`
})));

const nebulaHue = computed(() => genreNebulaHue[hoveredGenre.value] || `${Math.random() * 360}deg`);
const nebulaStyles = computed(() => Array.from({ length: 25 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  width: `${Math.random() * 80 + 30}px`,
  height: `${Math.random() * 80 + 30}px`,
  animationDuration: `${Math.random() * 30 + 20}s`,
  animationDelay: `${Math.random() * 15}s`,
  '--hue': hoveredGenre.value ? nebulaHue.value : `${Math.random() * 360}deg`
})));

const planetStyles = computed(() => Array.from({ length: 4 }, () => ({
  '--orbit-radius': `${Math.random() * 200 + 150}px`,
  '--orbit-speed': `${Math.random() * 40 + 20}s`,
  '--orbit-delay': `${Math.random() * 10}s`,
  '--size': `${Math.random() * 40 + 20}px`
})));

const satelliteStyles = computed(() => Array.from({ length: 6 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 20 + 5}%`,
  animationDuration: `${Math.random() * 60 + 40}s`,
  animationDelay: `${Math.random() * 30}s`
})));

// Splash stars for login overlay
const splashStars = computed(() => Array.from({ length: 150 }, (_, n) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  opacity: Math.random() * 0.8 + 0.2,
  '--twinkle-duration': `${Math.random() * 3 + 1.5}s`,
  '--twinkle-delay': `${Math.random() * 4}s`,
  animation: `twinkle var(--twinkle-duration) ease-in-out var(--twinkle-delay) infinite`
})));

const tmdbClient = axios.create({ baseURL: TMDB_BASE_URL });
const apiClient = axios.create({ 
  baseURL: API_BASE
});

// Add request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken && config.url?.startsWith('/admin/')) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ... rest of your script methods remain exactly the same ...
const moveLogo = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width / 2) / 16;
  const y = (e.clientY - rect.top - rect.height / 2) / 16;
  logoX.value = x;
  logoY.value = y;
  logoScale.value = 1.04;
};

const resetLogo = () => {
  logoX.value = 0;
  logoY.value = 0;
  logoScale.value = 1;
};

const loadData = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;
  if (reset) {
    movies.value = [];
    page.value = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const endpoint = searchQuery.value ? `/search/${mode.value}` : `/trending/${mode.value}/week`;
  try {
    const res = await tmdbClient.get(endpoint, {
      params: { api_key: TMDB_API_KEY, query: searchQuery.value, page: page.value, include_adult: false }
    });
    const newItems = res.data.results.filter(newItem => !movies.value.some(existingItem => existingItem.id === newItem.id));
    movies.value = [...movies.value, ...newItems];
    page.value++;
  } catch (err) {
    console.error('API Error:', err);
  } finally {
    loading.value = false;
  }
};

const loadHeroMovies = async () => {
  try {
    const res = await tmdbClient.get('/trending/movie/week', { params: { api_key: TMDB_API_KEY, page: 1 } });
    heroMovies.value = res.data.results || [];
  } catch (e) {
    console.error(e);
  }
};

const toggleMode = (newMode) => {
  mode.value = newMode;
  loadData(true);
};

const handleSearch = async (reset = false) => {
  if (!searchQuery.value.trim()) {
    return resetHome();
  }
  if (reset) {
    await loadData(true);
  } else {
    await loadData(true);
  }
};

const debouncedSearch = () => {
  clearTimeout(searchTimeout.value);
  searchTimeout.value = window.setTimeout(() => {
    if (searchQuery.value.trim()) {
      handleSearch(true);
    } else {
      resetHome();
    }
  }, 300);
};

const setHoverGenre = (genreIds = []) => {
  if (!Array.isArray(genreIds) || genreIds.length === 0) {
    hoveredGenre.value = '';
    return;
  }
  const foundGenre = genreIds.map(id => movieGenres[id]).find(Boolean);
  hoveredGenre.value = foundGenre || '';
};

// Advanced search with filters
const handleAdvancedSearch = async () => {
  loading.value = true;
  movies.value = [];
  page.value = 1;
  try {
    const endpoint = `/search/${mode.value}`;
    const res = await apiClient.get(endpoint, {
      params: {
        query: searchQuery.value,
        genre: advancedFilters.value.genre,
        year: advancedFilters.value.year,
        rating: advancedFilters.value.rating,
        sort_by: advancedFilters.value.sortBy,
        page: page.value
      }
    });
    movies.value = res.data.results.filter(newItem => !movies.value.some(existingItem => existingItem.id === newItem.id));
    page.value++;
  } catch (err) {
    console.error('Advanced search error:', err);
  } finally {
    loading.value = false;
  }
};

const resetHome = () => {
  searchQuery.value = '';
  trailerUrl.value = null;
  fullMovieUrl.value = null;
  showCinemaHall.value = false;
  currentMovieId.value = null;
  currentMovieDownloadUrl.value = null;
  currentMovieFallbackSources.value = [];
  currentMovieYoutubeUrl.value = '';
  mode.value = 'movie';
  currentPageName.value = 'home';
  loadData(true);
};

const setPage = (p) => {
  currentPageName.value = p;
  trailerUrl.value = null;
  fullMovieUrl.value = null;
  showCinemaHall.value = false;
  currentMovieId.value = null;
  currentMovieDownloadUrl.value = null;
  currentMovieFallbackSources.value = [];
  currentMovieYoutubeUrl.value = '';
  if (p === 'admin') {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken && isAdmin.value) {
      isAdminAuthenticated.value = true;
      loadAdminDashboard();
    }
  }
};

const openDetails = (item) => {
  currentMovieTitle.value = item.title || item.name || 'Untitled';
  // Set mode based on item's media_type if available
  if (item.media_type === 'movie' || item.media_type === 'tv') {
    mode.value = item.media_type;
  }
};

const playFullMovie = async (item) => {
  const type = item.media_type || mode.value || 'movie';
  const mediaType = type === 'tv' ? 'tv' : 'movie';
  currentMovieTitle.value = item.title || item.name || 'Now Playing';
  currentMovieId.value = item.id;
  currentMovieDownloadUrl.value = `https://vidsrc.to/${mediaType}/${item.id}`;
  
  trailerUrl.value = null;
  fullMovieUrl.value = null;
  showCinemaHall.value = true;
  
  // Open movie in new tab
  const movieUrl = `https://vidsrc.to/embed/${mediaType}/${item.id}`;
  window.open(movieUrl, '_blank', 'noopener,noreferrer');
  
  if (isAuthenticated.value) {
    try {
      await apiClient.post('/watch-history', { movieId: item.id, movieTitle: item.title || item.name });
    } catch (error) {
      console.error('Watch history error:', error);
    }
  }
  await loadComments(item.id);
};

const downloadMovie = async () => {
  if (!currentMovieId.value) return;
  const type = mode.value === 'movie' ? 'movie' : 'tv';
  try {
    const res = await apiClient.get(`/download/${type}/${currentMovieId.value}`);
    const downloadUrl = res.data.url;
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Download link not available.');
    }
  } catch (error) {
    console.error('Download error:', error);
    alert('Could not retrieve the download link.');
  }
};

const downloadMovieFile = async (item) => {
  try {
    alert(`Preparing download options for "${item.title || item.name}"...`);
    
    // Try to download trailer if available
    const trailerDownloaded = await downloadTrailer(item);
    
    // Download poster
    if (item.poster_path) {
      const posterUrl = `https://image.tmdb.org/t/p/original${item.poster_path}`;
      const link = document.createElement('a');
      link.href = posterUrl;
      link.download = `${item.title || item.name}_poster.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Open streaming options
    const type = mode.value === 'movie' ? 'movie' : 'tv';
    const streamUrl = `https://vidsrc.to/${type}/${item.id}`;
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
    
    const trailerMsg = trailerDownloaded ? 'Trailer downloaded! ' : '';
    alert(`${trailerMsg}Poster downloaded! Movie opened in new tab for streaming. Use browser tools to download video if available.`);
  } catch (error) {
    console.error('Download error:', error);
    const type = mode.value === 'movie' ? 'movie' : 'tv';
    const fallbackUrl = `https://vidsrc.to/${type}/${item.id}`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    alert('Opening movie in new tab. Use browser download tools for video.');
  }
};

const downloadTrailer = async (item) => {
  try {
    const res = await tmdbClient.get(`/${mode.value}/${item.id}/videos`, { params: { api_key: TMDB_API_KEY } });
    const trailer = res.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    
    if (trailer) {
      const trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      window.open(trailerUrl, '_blank', 'noopener,noreferrer');
      alert('Trailer opened in new tab. Use browser download tools to save the video.');
      return true;
    } else {
      alert('No trailer available for download.');
      return false;
    }
  } catch (error) {
    console.error('Trailer download error:', error);
    alert('Could not load trailer.');
    return false;
  }
};

const downloadPoster = async (item) => {
  if (item.poster_path) {
    const posterUrl = `https://image.tmdb.org/t/p/original${item.poster_path}`;
    const link = document.createElement('a');
    link.href = posterUrl;
    link.download = `${item.title || item.name}_poster.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Poster downloaded successfully!');
  } else {
    alert('No poster available for download.');
  }
};

const cacheForOffline = async (item) => {
  try {
    if ('caches' in window) {
      const cache = await caches.open('movie-cache-v1');
      const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null;
      
      if (posterUrl) {
        await cache.add(posterUrl);
        alert('Poster cached for offline viewing!');
      } else {
        alert('No poster available to cache.');
      }
    } else {
      alert('Offline caching not supported in this browser.');
    }
  } catch (error) {
    console.error('Cache error:', error);
    alert('Could not cache for offline viewing.');
  }
};

const playTrailer = async (item) => {
  try {
    const type = item.media_type || mode.value || 'movie';
    currentMovieTitle.value = item.title || item.name || 'Trailer';
    currentMovieId.value = item.id;
    currentMovieDownloadUrl.value = null;
    showCinemaHall.value = true;
    fullMovieUrl.value = null;
    trailerUrl.value = null;
    currentMovieFallbackSources.value = [];
    currentMovieYoutubeUrl.value = '';

    const res = await tmdbClient.get(`/${type}/${item.id}/videos`, { params: { api_key: TMDB_API_KEY } });
    const supported = ['YouTube', 'Vimeo'];
    let trailer = res.data.results.find(v => v.type === 'Trailer' && supported.includes(v.site));
    if (!trailer) {
      trailer = res.data.results.find(v => supported.includes(v.site));
    }

    if (trailer && trailer.site === 'YouTube') {
      trailerUrl.value = `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`;
      currentMovieYoutubeUrl.value = `https://www.youtube.com/watch?v=${trailer.key}`;
    } else if (trailer && trailer.site === 'Vimeo') {
      trailerUrl.value = `https://player.vimeo.com/video/${trailer.key}?autoplay=1&muted=1`;
      currentMovieYoutubeUrl.value = '';
    } else {
      const searchQuery = encodeURIComponent(`${item.title || item.name} official trailer`);
      currentMovieYoutubeUrl.value = `https://www.youtube.com/results?search_query=${searchQuery}`;
      window.open(currentMovieYoutubeUrl.value, '_blank', 'noopener,noreferrer');
    }

    await loadComments(item.id);
  } catch (err) {
    console.error('Trailer error', err);
    const searchQuery = encodeURIComponent(`${item.title || item.name} official trailer`);
    currentMovieYoutubeUrl.value = `https://www.youtube.com/results?search_query=${searchQuery}`;
    window.open(currentMovieYoutubeUrl.value, '_blank', 'noopener,noreferrer');
  }
};

const closePlayer = () => {
  trailerUrl.value = null;
  fullMovieUrl.value = null;
  showCinemaHall.value = false;
  currentMovieId.value = null;
  currentMovieDownloadUrl.value = null;
  currentMovieFallbackSources.value = [];
  currentMovieYoutubeUrl.value = '';
  comments.value = [];
};

const reopenMovie = () => {
  if (!currentMovieId.value) return;
  const type = mode.value === 'movie' ? 'movie' : 'tv';
  const movieUrl = `https://vidsrc.to/embed/${type}/${currentMovieId.value}`;
  window.open(movieUrl, '_blank', 'noopener,noreferrer');
};

const switchTrailerSource = (src) => {
  trailerUrl.value = src;
  currentMovieFallbackSources.value = currentMovieFallbackSources.value.filter(s => s !== src);
};

const openYoutubeTrailer = () => {
  if (currentMovieYoutubeUrl.value) {
    window.open(currentMovieYoutubeUrl.value, '_blank', 'noopener,noreferrer');
  }
};

const loadComments = async (movieId = null) => {
  const id = movieId || currentMovieId.value;
  if (!id) return;
  try {
    const res = await apiClient.get(`/comments/${id}`);
    comments.value = res.data || [];
  } catch (error) {
    comments.value = [];
  }
};

const submitComment = async () => {
  commentLoading.value = true;
  commentError.value = '';
  commentSuccess.value = false;
  try {
    const payload = {
      movieId: currentMovieId.value || currentMovieTitle.value,
      userName: commentName.value,
      text: commentText.value
    };
    const res = await apiClient.post('/comments', payload);
    comments.value = [...comments.value, res.data];
    commentName.value = '';
    commentText.value = '';
    commentSuccess.value = true;
    await loadComments(currentMovieId.value);
  } catch (error) {
    commentError.value = error.response?.data?.message || 'Failed to send comment';
  } finally {
    commentLoading.value = false;
  }
};

const handleLogin = async () => {
  loginLoading.value = true;
  loginError.value = '';
  try {
    const payload = {
      email: loginEmail.value.includes('@') ? loginEmail.value : '',
      username: loginEmail.value.includes('@') ? '' : loginEmail.value,
      password: loginPassword.value
    };

    const response = await apiClient.post('/auth/login', payload);
    user.value = response.data.user;
    isAuthenticated.value = true;
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    if (response.data.user?.role === 'admin') {
      localStorage.setItem('admin_token', response.data.token);
      isAdminAuthenticated.value = true;
    }
    
    resetHome();
    alert('Welcome back to the galaxy!');
  } catch (error) {
    loginError.value = error.response?.data?.error || 'Login failed';
  } finally {
    loginLoading.value = false;
  }
};

const handleRegister = async () => {
  registerLoading.value = true;
  registerError.value = '';
  if (registerPassword.value !== registerConfirmPassword.value) {
    registerError.value = 'Passwords do not match';
    registerLoading.value = false;
    return;
  }
  try {
    await apiClient.post('/auth/register', { email: registerEmail.value, password: registerPassword.value });
    alert('Account created! Please login.');
    isRegister.value = false;
    loginEmail.value = registerEmail.value;
    registerEmail.value = registerPassword.value = registerConfirmPassword.value = '';
  } catch (error) {
    registerError.value = error.response?.data?.message || 'Registration failed';
  } finally {
    registerLoading.value = false;
  }
};

const handleForgotPassword = async () => {
  forgotLoading.value = true;
  resetSuccess.value = false;
  try {
    await apiClient.post('/auth/forgot-password', { email: forgotEmail.value });
    resetSuccess.value = true;
    alert('Password reset link sent! Check your email.');
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to send reset email');
  } finally {
    forgotLoading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await apiClient.post('/auth/logout');
    user.value = null;
    isAuthenticated.value = false;
    
    // Clear the token
    localStorage.removeItem('auth_token');
    
    resetHome();
    alert('See you in the stars!');
  } catch (error) {
    console.error('Logout error:', error);
    resetHome();
  }
};

const copyEmail = () => { navigator.clipboard.writeText('kasamuel71@gmail.com'); alert('Email copied!'); };
const copyPhone = () => { navigator.clipboard.writeText('0723112258'); alert('Phone copied!'); };
const openWhatsApp = () => { window.open('https://wa.me/250787949343', '_blank', 'noopener,noreferrer'); };
const openInstagram = () => { window.open('https://instagram.com/ka_samuel250', '_blank', 'noopener,noreferrer'); };

const checkAuth = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return;
  try {
    const response = await apiClient.get('/auth/me');
    user.value = response.data.user;
    isAuthenticated.value = true;
    await loadProfile();
    await loadRecommendations();
  } catch (error) {
    console.warn('Auth restore failed:', error);
    localStorage.removeItem('auth_token');
    isAuthenticated.value = false;
    user.value = null;
  }
};

onMounted(async () => {
  await checkAuth();
  changeTheme(); // Apply initial theme
  await loadHeroMovies();
  await loadData();
  await loadComments();
  await initInfiniteScroll();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

// New methods for additional features
const loadProfile = async () => {
  try {
    const res = await apiClient.get('/profile');
    profile.value = res.data.profile;
    watchHistory.value = res.data.watchHistory;
    watchlists.value = res.data.watchlists;
    favorites.value = res.data.favorites;
  } catch (error) {
    console.error('Profile load error:', error);
  }
};

const updateProfile = async () => {
  try {
    await apiClient.put('/profile', profile.value);
    alert('Profile updated!');
  } catch (error) {
    alert('Failed to update profile');
  }
};

const loadRecommendations = async () => {
  try {
    const res = await apiClient.get('/recommendations');
    recommendations.value = res.data.recommendations;
  } catch (error) {
    console.error('Recommendations error:', error);
  }
};

const openMovieDetails = async (movie) => {
  selectedMovie.value = movie;
  currentPageName.value = 'movie-details';
  try {
    const res = await apiClient.get(`/movie/${movie.id}`);
    movieDetails.value = res.data;
    const similarRes = await apiClient.get(`/movie/${movie.id}/similar`);
    similarMovies.value = similarRes.data.results;
    const reviewsRes = await apiClient.get(`/movie/${movie.id}/reviews`);
    movieReviews.value = reviewsRes.data.results;
  } catch (error) {
    console.error('Movie details error:', error);
  }
};

const addToFavorites = async (movie) => {
  if (!isAuthenticated.value) {
    alert('Login to save favorites.');
    setPage('login');
    return;
  }
  try {
    await apiClient.post('/favorites', {
      movieId: movie.id,
      movieTitle: movie.title || movie.name,
      posterPath: movie.poster_path
    });
    alert('Added to favorites!');
    await loadProfile();
  } catch (error) {
    console.error('Favorite save error:', error);
    alert('Failed to add to favorites');
  }
};

const addToWatchlist = async (movie) => {
  if (!isAuthenticated.value) {
    alert('Login to save a movie to your watchlist.');
    setPage('login');
    return;
  }
  selectedMovieForList.value = movie;
  showWatchlistModal.value = true;
};

const closeWatchlistModal = () => {
  showWatchlistModal.value = false;
  selectedMovieForList.value = null;
  showNewListInput.value = false;
  newListName.value = '';
};

const addToSpecificList = async (list) => {
  try {
    await apiClient.post(`/watchlists/${list.id}/items`, {
      movieId: selectedMovieForList.value.id,
      movieTitle: selectedMovieForList.value.title || selectedMovieForList.value.name,
      posterPath: selectedMovieForList.value.poster_path
    });
    alert(`Added to ${list.name}`);
    closeWatchlistModal();
    await loadProfile();
  } catch (error) {
    console.error('Add to list error:', error);
    alert('Could not add to list.');
  }
};

const createAndAddToList = async () => {
  if (!newListName.value.trim()) return;
  try {
    const res = await apiClient.post('/watchlists', { name: newListName.value });
    const newList = res.data;
    await addToSpecificList(newList);
  } catch (error) {
    console.error('Create list error:', error);
    alert('Could not create list.');
  }
};

const deleteAdminUser = async (userId) => {
  try {
    if (!confirm('Are you sure you want to remove this user?')) return;
    await apiClient.delete(`/admin/users/${userId}`);
    adminUsers.value = adminUsers.value.filter(u => u.id !== userId);
    alert('User removed successfully.');
  } catch (error) {
    console.error('Delete user error:', error);
    alert('Could not remove user.');
  }
};

const loadAdminDashboard = async () => {
  try {
    const [usersRes, statsRes, commentsRes, messagesRes, activityRes] = await Promise.all([
      apiClient.get('/admin/users'),
      apiClient.get('/admin/stats'),
      apiClient.get('/admin/comments'),
      apiClient.get('/admin/messages'),
      apiClient.get('/admin/activity')
    ]);
    adminUsers.value = usersRes.data.users || [];
    adminStats.value = statsRes.data || { totalUsers: 0, totalWatchRecords: 0 };
    movieViews.value = statsRes.data.topMovieViews || [];
    allComments.value = commentsRes.data.comments || [];
    adminMessages.value = messagesRes.data.messages || [];
    recentActivity.value = activityRes.data.activity || [];
  } catch (error) {
    console.error('Admin dashboard load error:', error);
  }
};

// Admin login with admin:admin
const handleAdminLogin = async () => {
  adminLoginError.value = '';
  try {
    const res = await apiClient.post('/auth/admin-login', {
      username: adminLoginUsername.value,
      password: adminLoginPassword.value
    });
    if (res.data.token) {
      localStorage.setItem('admin_token', res.data.token);
    }
    isAdminAuthenticated.value = true;
    loadAdminDashboard();
  } catch (error) {
    adminLoginError.value = error.response?.data?.error || 'Invalid admin credentials';
  }
};

const handleAdminLogout = () => {
  isAdminAuthenticated.value = false;
  adminLoginUsername.value = '';
  adminLoginPassword.value = '';
  adminActiveTab.value = 'users';
  localStorage.removeItem('admin_token');
};

// Admin comment management
const deleteAdminComment = async (commentId) => {
  try {
    if (!confirm('Delete this comment?')) return;
    await apiClient.delete(`/admin/comments/${commentId}`);
    allComments.value = allComments.value.filter(c => c.id !== commentId);
    alert('Comment deleted.');
  } catch (error) {
    console.error('Delete comment error:', error);
  }
};

// Admin message management
const deleteAdminMessage = async (msgId) => {
  try {
    if (!confirm('Delete this message?')) return;
    await apiClient.delete(`/admin/messages/${msgId}`);
    adminMessages.value = adminMessages.value.filter(m => m.id !== msgId);
    alert('Message deleted.');
  } catch (error) {
    console.error('Delete message error:', error);
  }
};

const replyToMessage = async (msg) => {
  if (!msg.replyText?.trim()) return;
  try {
    await apiClient.post(`/admin/messages/${msg.id}/reply`, { reply: msg.replyText });
    msg.replyText = '';
    alert('Reply sent.');
    loadAdminDashboard();
  } catch (error) {
    console.error('Reply error:', error);
  }
};

const viewUserActivity = (user) => {
  alert(`Viewing activity for ${user.email} - Opening detailed view...`);
};

// User sends message to admin
const sendAdminMessage = async () => {
  adminMsgLoading.value = true;
  adminMsgSuccess.value = false;
  adminMsgError.value = '';
  try {
    await apiClient.post('/admin/messages', {
      name: adminMsgName.value,
      email: adminMsgEmail.value,
      subject: adminMsgSubject.value,
      message: adminMsgMessage.value
    });
    adminMsgSuccess.value = true;
    adminMsgName.value = '';
    adminMsgEmail.value = '';
    adminMsgSubject.value = '';
    adminMsgMessage.value = '';
  } catch (error) {
    adminMsgError.value = error.response?.data?.error || 'Failed to send message.';
  } finally {
    adminMsgLoading.value = false;
  }
};

const filteredAdminUsers = computed(() => {
  if (!adminUserSearch.value.trim()) return adminUsers.value;
  return adminUsers.value.filter(u => u.email.toLowerCase().includes(adminUserSearch.value.toLowerCase()));
});

const getTrailerEmbedUrl = (video) => {
  if (!video) return null;
  if (video.site === 'YouTube') return `https://www.youtube.com/embed/${video.key}?autoplay=1&modestbranding=1&rel=0`;
  if (video.site === 'Vimeo') return `https://player.vimeo.com/video/${video.key}?autoplay=1`;
  if (video.site === 'Dailymotion') return `https://www.dailymotion.com/embed/video/${video.key}?autoplay=1`;
  return null;
};

const createWatchlist = async () => {
  try {
    await apiClient.post('/watchlists', { name: newListName.value });
    newListName.value = '';
    loadProfile();
  } catch (error) {
    alert('Failed to create watchlist');
  }
};

const shareMovie = async (movie) => {
  const url = `${window.location.origin}${window.location.pathname}?movieId=${movie.id}`;
  const message = `${movie.title || movie.name} — ${url}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: movie.title || movie.name, text: movie.overview || 'Check out this movie', url });
      return;
    } catch (_) {
      // fall through to clipboard fallback
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(message);
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  alert('Link copied and WhatsApp share opened.');
};

const updateContactOrbit = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  contactOrbitPosition.value = { x: x.toFixed(2), y: y.toFixed(2) };
};

const changeTheme = () => {
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  localStorage.setItem('theme', currentTheme.value);
};

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
  if (isChatOpen.value && chatMessages.value.length === 0) {
    chatMessages.value.push({
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help with movie recommendations, answer questions about the app, or chat about anything. How can I assist you today?'
    });
  }
};

const sendMessage = async () => {
  if (!chatInput.value.trim() || isChatLoading.value) return;

  const userMessage = chatInput.value.trim();
  chatMessages.value.push({ role: 'user', content: userMessage });
  chatInput.value = '';
  isChatLoading.value = true;

  try {
    const response = await callGeminiAPI(userMessage);
    chatMessages.value.push({ role: 'assistant', content: response });
  } catch (error) {
    console.error('AI Chat error:', error);
    chatMessages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again later.'
    });
  } finally {
    isChatLoading.value = false;
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
      }
    });
  }
};

const callGeminiAPI = async (message) => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI('AIzaSyCRoDifxmvJwGBdtUOiEVmGF-gsWQKNVLU');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an AI assistant for a movie streaming app called "Ka_samuel250 Flims_store". 
  The app features movie browsing, trailers, user profiles, watchlists, and more.
  Answer questions helpfully and stay in character as a friendly movie expert.
  User message: ${message}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;500;800&display=swap');

:root {
  --primary: #00ccff;
  --accent: #ff0044;
  --dark: #0a0b1e;
  --glass: rgba(255,255,255,0.08);
  --gradient-bg: linear-gradient(135deg, #0a0b1e 0%, #1a1b2e 50%, #010204 100%);
}

[data-theme="dark"] {
  --primary: #4a90e2;
  --accent: #e74c3c;
  --dark: #0d0d0d;
  --gradient-bg: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #000000 100%);
}

[data-theme="neon"] {
  --primary: #00ff88;
  --accent: #ff0080;
  --dark: #000011;
  --gradient-bg: linear-gradient(135deg, #000011 0%, #001122 50%, #000000 100%);
}

[data-theme="retro"] {
  --primary: #ff6b35;
  --accent: #f7931e;
  --dark: #2d1b69;
  --gradient-bg: linear-gradient(135deg, #2d1b69 0%, #4a148c 50%, #1a0033 100%);
}

* { box-sizing: border-box; }
body { margin: 0; padding: 0; overflow-x: hidden; }
.app-container {
  min-height: 100vh;
  background: var(--gradient-bg);
  color: #e0e0e0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
  overflow: hidden;
}
.space-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.star, .shooting-star, .nebula-particle, .planet-orbit, .satellite, .plasma {
  position: absolute;
  border-radius: 50%;
}
.star {
  width: 2px;
  height: 2px;
  background: white;
  /* Enhanced star animation using CSS custom properties */
}
.shooting-star {
  width: 140px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ccff, transparent);
}
.nebula-particle {
  background: radial-gradient(circle, rgba(0,204,255,0.18), transparent 70%);
  filter: blur(10px);
}
.planet-orbit {
  width: var(--size, 24px);
  height: var(--size, 24px);
  background: radial-gradient(circle at 30% 30%, #fff, #00ccff 40%, #0044ff 100%);
  box-shadow: 0 0 20px rgba(0,204,255,0.5);
}
.satellite {
  width: 10px;
  height: 10px;
  background: #ff0044;
  box-shadow: 0 0 10px #ff0044;
}
.plasma {
  width: 400px;
  height: 400px;
  filter: blur(80px);
  opacity: 0.22;
}
.p-1 { top: -80px; left: -120px; background: #00ccff; }
.p-2 { top: 20%; right: -100px; background: #ff0044; }
.p-3 { bottom: -120px; left: 25%; background: #8a2be2; }

/* Enhanced Animations */
@keyframes twinkle {
  0%, 100% { 
    opacity: 0.3; 
    transform: scale(0.8) rotate(0deg);
  }
  25% { 
    opacity: 1; 
    transform: scale(1.2) rotate(90deg);
  }
  50% { 
    opacity: 0.4; 
    transform: scale(0.6) rotate(180deg);
  }
  75% { 
    opacity: 0.9; 
    transform: scale(1.1) rotate(270deg);
  }
}

@keyframes flyby {
  0% {
    transform: translateX(-30vw) translateY(0) rotate(-45deg) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translateX(-25vw) translateY(-5vh) rotate(-45deg) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translateX(50vw) translateY(20vh) rotate(-45deg) scale(1.1);
  }
  100% {
    transform: translateX(150vw) translateY(40vh) rotate(-45deg) scale(0.8);
    opacity: 0;
  }
}

@keyframes drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: hue-rotate(0deg) brightness(1);
  }
  33% {
    transform: translate3d(15px, -10px, 0) scale(1.05);
    filter: hue-rotate(60deg) brightness(1.1);
  }
  66% {
    transform: translate3d(-10px, 15px, 0) scale(0.95);
    filter: hue-rotate(120deg) brightness(0.9);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: hue-rotate(0deg) brightness(1);
  }
}

@keyframes floatPlanet {
  0% {
    transform: translateY(0) translateX(0) rotate(0deg) scale(1);
    box-shadow: 0 0 20px rgba(0,204,255,0.5);
  }
  25% {
    transform: translateY(-20px) translateX(10px) rotate(90deg) scale(1.1);
    box-shadow: 0 0 30px rgba(0,204,255,0.7);
  }
  50% {
    transform: translateY(-10px) translateX(-10px) rotate(180deg) scale(1);
    box-shadow: 0 0 25px rgba(0,204,255,0.6);
  }
  75% {
    transform: translateY(-25px) translateX(15px) rotate(270deg) scale(1.05);
    box-shadow: 0 0 35px rgba(0,204,255,0.8);
  }
  100% {
    transform: translateY(0) translateX(0) rotate(360deg) scale(1);
    box-shadow: 0 0 20px rgba(0,204,255,0.5);
  }
}

@keyframes satelliteDrift {
  0% {
    transform: translateX(0) rotate(0deg);
    opacity: 0.7;
  }
  25% {
    transform: translateX(20px) rotate(90deg);
    opacity: 1;
  }
  50% {
    transform: translateX(-15px) rotate(180deg);
    opacity: 0.8;
  }
  75% {
    transform: translateX(25px) rotate(270deg);
    opacity: 0.9;
  }
  100% {
    transform: translateX(0) rotate(360deg);
    opacity: 0.7;
  }
}

@keyframes pulseGlow {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    opacity: 0.22;
    filter: brightness(1) blur(80px);
  }
  25% { 
    transform: scale(1.08) rotate(90deg);
    opacity: 0.35;
    filter: brightness(1.3) blur(90px);
  }
  50% { 
    transform: scale(1.15) rotate(180deg);
    opacity: 0.28;
    filter: brightness(1.1) blur(85px);
  }
  75% { 
    transform: scale(1.12) rotate(270deg);
    opacity: 0.4;
    filter: brightness(1.4) blur(95px);
  }
}

@keyframes pulseBadge {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 18px rgba(255,80,130,0.22);
  }
  50% {
    transform: scale(1.04);
    box-shadow: 0 0 32px rgba(255,80,130,0.32);
  }
}

@keyframes skeletonPulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

@keyframes searchPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes nameGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(0,204,255,0.15); }
  50% { text-shadow: 0 0 30px rgba(0,204,255,0.3), 0 0 40px rgba(255,0,68,0.2); }
}

@keyframes contactFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(1deg); }
  50% { transform: translateY(-5px) rotate(-1deg); }
  75% { transform: translateY(-15px) rotate(0.5deg); }
}

@keyframes orbitSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(10,11,30,0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  backdrop-filter: blur(20px);
}

.modal-content h3 {
  color: #00ff88;
  margin-bottom: 1rem;
}

.modal-content p {
  color: rgba(255,255,255,0.8);
  margin-bottom: 1.5rem;
}

.watchlist-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.watchlist-option {
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.watchlist-option:hover {
  background: rgba(255,255,255,0.2);
}

.watchlist-option.new-list {
  border: 1px dashed rgba(255,255,255,0.3);
}

.new-list-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.new-list-input input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.modal-close {
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.chat-bg-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.chat-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(0,204,255,0.5);
  border-radius: 50%;
  animation: chatParticleFloat 8s ease-in-out infinite;
}

.chat-particle:nth-child(odd) {
  background: rgba(255,0,68,0.5);
  animation-duration: 6s;
}

/* Apply animations to elements */
.star { animation: twinkle var(--twinkle-duration, 3s) ease-in-out var(--twinkle-delay, 0s) infinite; }
.shooting-star { animation: flyby linear infinite; }
.nebula-particle { animation: drift linear infinite; }
.planet-orbit { animation: floatPlanet linear infinite; }
.satellite { animation: satelliteDrift linear infinite; }
.plasma { animation: pulseGlow 14s ease-in-out infinite; }

.main-header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(18px);
  background: rgba(10,11,30,0.72);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
}
.logo-group { cursor: pointer; transition: transform .25s ease; }
.chameleon-name {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: .5px;
  background: linear-gradient(90deg, #00ccff, #ff0044, #8a2be2, #00ff88);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: colorShift 8s ease infinite, nameGlow 3s ease-in-out infinite;
  text-shadow: 0 0 20px rgba(0,204,255,0.15);
}
.chameleon-name span { opacity: .9; }
.nav-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: .5rem;
}
.pill, .mode-btn, .search-action-btn, .auth-btn, .exit-hall-btn, .back-btn, .tab-btn, .forgot-link {
  border: none;
  cursor: pointer;
  transition: all .3s cubic-bezier(.4,0,.2,1);
  position: relative;
  overflow: hidden;
}
.pill {
  padding: .65rem 1rem;
  border-radius: 12px;
  color: rgba(255,255,255,.85);
  background: rgba(255,255,255,.06);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.06);
  font-size: .85rem;
  font-weight: 500;
  letter-spacing: .3px;
}
.pill::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0,204,255,.12), rgba(255,0,68,.08));
  opacity: 0;
  transition: opacity .3s ease;
}
.pill:hover::before { opacity: 1; }
.pill:hover {
  transform: translateY(-2px);
  border-color: rgba(0,204,255,.2);
  box-shadow: 0 8px 24px rgba(0,204,255,.12);
  color: #fff;
}
.pill.active {
  background: linear-gradient(135deg, rgba(0,204,255,.25), rgba(255,0,68,.2));
  border-color: rgba(0,204,255,.3);
  box-shadow: 0 0 20px rgba(0,204,255,.15), inset 0 1px 0 rgba(255,255,255,.1);
  color: #fff;
  font-weight: 600;
}
.pill span { margin-right: 4px; }
.mode-btn:hover, .search-action-btn:hover, .auth-btn:hover, .exit-hall-btn:hover, .back-btn:hover, .tab-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(0,204,255,.18);
}
.cinema-actions {
  display: flex;
  gap: .75rem;
  align-items: center;
}
.content-wrapper { position: relative; z-index: 2; padding: 1.2rem; }
.hero-section { max-width: 1400px; margin: 0 auto 1rem; display: grid; gap: 1rem; }
.hero-copy { padding: 1rem 0 .5rem; display: grid; gap: 1rem; }
.hero-heading-group { display: grid; gap: .75rem; }
.hero-description-group { display: grid; gap: .85rem; }
.hero-description { margin: 0; color: rgba(255,255,255,.76); max-width: 55rem; line-height: 1.75; }
.hero-meta { display: flex; flex-wrap: wrap; gap: .75rem; font-size: .95rem; color: rgba(255,255,255,.72); }
.hero-meta span { background: rgba(255,255,255,.06); padding: .65rem 1rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.08); }
.hero-kicker { color: #00ff88; text-transform: uppercase; letter-spacing: 2px; font-size: .8rem; margin: 0 0 .5rem; }
.hero-carousel {
  overflow: hidden;
  padding: 1rem 0 1.5rem;
  border-radius: 24px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
}
.hero-carousel-track {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  animation: scrollHeroes 35s linear infinite;
}
.carousel-card {
  position: relative;
  flex: 0 0 180px;
  border-radius: 20px;
  overflow: hidden;
  min-height: 280px;
  background: rgba(255,255,255,.06);
  box-shadow: 0 16px 42px rgba(0,0,0,.18);
}
.hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 1rem;
  background: linear-gradient(to top, rgba(5,6,18,.96), rgba(5,6,18,.15) 55%, transparent);
  opacity: 0;
  transition: opacity .25s ease;
}
.carousel-card:hover .hero-overlay { opacity: 1; }
.hero-watch-btn {
  padding: .65rem 1.2rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: .75rem;
  letter-spacing: .8px;
  text-transform: uppercase;
  color: #fff;
  background: rgba(10,11,30,.9);
  border: 1px solid rgba(0,204,255,.3);
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,204,255,.12);
  transition: all .3s cubic-bezier(.4,0,.2,1);
  display: inline-flex;
  align-items: center;
  gap: .5rem;
}
.hero-watch-btn:hover {
  background: linear-gradient(135deg, #00ccff, #0088cc);
  color: #0a0b1e;
  border-color: #00ccff;
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,204,255,.3);
}
.hero-poster, .carousel-card {
  position: relative;
}
.trend-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  padding: .55rem .9rem;
  font-size: .8rem;
  font-weight: 700;
  color: #fff;
  background: rgba(255,0,68,.92);
  border-radius: 999px;
  box-shadow: 0 16px 30px rgba(255,0,68,.22);
  letter-spacing: .02em;
  text-transform: uppercase;
  animation: pulseBadge 4s ease-in-out infinite;
}
.carousel-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
@keyframes scrollHeroes {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.hero-title { margin: 0; font-size: clamp(1.5rem, 4vw, 3rem); color: #fff; }
.hero-subtitle { margin: .5rem 0 0; color: rgba(255,255,255,.72); max-width: 60ch; }
.hero-strip { display: flex; gap: 1rem; overflow-x: auto; padding: .25rem .1rem 1rem; scrollbar-width: thin; }
.hero-poster { flex: 0 0 120px; height: 180px; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,.35); transform: translateZ(0); cursor: pointer; transition: transform .25s ease; }
.hero-poster:hover { transform: translateY(-8px) scale(1.04); }
.hero-poster img, .poster-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-no-poster { width: 100%; height: 100%; display: grid; place-items: center; padding: .75rem; text-align: center; background: linear-gradient(135deg, rgba(0,204,255,.2), rgba(255,0,68,.2)); }
.search-section { max-width: 1400px; margin: 0 auto 1rem; }
.search-container { display: grid; gap: 1rem; }
.mode-switcher { display: flex; gap: .75rem; flex-wrap: wrap; }
.mode-btn {
  padding: .85rem 1.15rem;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  color: #fff;
}
.search-glow-box {
  display: flex;
  gap: .75rem;
  padding: .8rem;
  border-radius: 24px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.03);
}
.search-glow-box input, .comment-textarea {
  flex: 1;
  min-width: 0;
  padding: 1rem 1.1rem;
  border: none;
  outline: none;
  color: #fff;
  background: transparent;
  font-size: 1rem;
}
.search-action-btn {
  padding: 1rem 1.25rem;
  border-radius: 18px;
  color: #001018;
  font-weight: 800;
  background: linear-gradient(135deg, #00ccff, #00ff88);
  animation: searchPulse 2s ease-in-out infinite;
}
.movies-section { max-width: 1500px; margin: 0 auto; }
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
.movie-card {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.14);
  backdrop-filter: blur(12px);
  box-shadow: 0 22px 60px rgba(0,0,0,.25);
  cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
}
.movie-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 28px 72px rgba(0,204,255,.18); border-color: rgba(255,255,255,.22); }
.movie-card-actions {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  display: flex;
  gap: 0.5rem;
  z-index: 4;
}
.card-action-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.55);
  color: #fff;
  box-shadow: 0 10px 22px rgba(0,0,0,.24);
  transition: transform .2s ease, background .2s ease;
}
.card-action-btn:hover { transform: scale(1.08); background: rgba(0,0,0,.75); }
.card-action-btn.watchlist { background: rgba(255,255,255,.12); }
.poster-box { position: relative; aspect-ratio: 2 / 3; overflow: hidden; }
.no-poster { width: 100%; height: 100%; display: grid; place-items: center; padding: 1rem; text-align: center; background: linear-gradient(135deg, rgba(0,204,255,.22), rgba(255,0,68,.25)); color: #fff; font-weight: 600; }
.card-badge {
  position: absolute;
  top: .75rem;
  left: .75rem;
  z-index: 3;
  padding: .45rem .7rem;
  border-radius: 999px;
  font-size: .82rem;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(10px);
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 1rem;
  background: linear-gradient(to top, rgba(5,6,18,.96), rgba(5,6,18,.15) 55%, transparent);
  opacity: 0;
  transition: opacity .25s ease;
}
.movie-card:hover .overlay { opacity: 1; }
.overlay-content { width: 100%; }
.m-title { margin: 0 0 .35rem; color: #fff; font-size: 1rem; }
.m-info { margin: 0 0 .75rem; color: rgba(255,255,255,.72); }
.btns { display: flex; gap: .65rem; flex-wrap: wrap; }
.btn-watch-gradient, .btn-trailer-red {
  flex: 1 1 120px;
}
.btn-watch-gradient {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .7rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: .8rem;
  letter-spacing: .8px;
  text-transform: uppercase;
  background: #0a0b1e;
  color: #fff;
  border: 1px solid rgba(0,204,255,.3);
  box-shadow: 0 4px 20px rgba(0,204,255,.12);
  transition: all .3s cubic-bezier(.4,0,.2,1);
  cursor: pointer;
}
.btn-watch-gradient:hover {
  background: linear-gradient(135deg, #00ccff, #0088cc);
  color: #0a0b1e;
  border-color: #00ccff;
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,204,255,.3);
}

.btn-trailer-red {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .7rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: .8rem;
  letter-spacing: .8px;
  text-transform: uppercase;
  background: transparent;
  color: rgba(255,255,255,.7);
  border: 1px solid rgba(255,255,255,.15);
  transition: all .3s cubic-bezier(.4,0,.2,1);
  cursor: pointer;
}
.btn-trailer-red:hover {
  color: #ff4466;
  border-color: rgba(255,68,102,.5);
  background: rgba(255,68,102,.08);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255,68,102,.15);
}
.skeleton-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  min-height: 320px;
  padding: 1rem;
}
.skeleton-poster {
  width: 100%;
  height: 220px;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.16), rgba(255,255,255,.08));
  animation: skeletonPulse 1.5s ease-in-out infinite;
}
.skeleton-line {
  height: 16px;
  border-radius: 999px;
  margin-top: 1rem;
  background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.18), rgba(255,255,255,.08));
  animation: skeletonPulse 1.5s ease-in-out infinite;
}
.skeleton-line.short { width: 60%; }
.loader-zone { min-height: 120px; display: grid; place-items: center; padding: 1.5rem 0; }
.orbit-spinner { position: relative; width: 60px; height: 60px; }
.orbit {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(0,204,255,.15);
  border-top-color: #00ccff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.orbit:nth-child(2) { inset: 10px; animation-duration: 1.4s; border-top-color: #ff0044; }
.orbit:nth-child(3) { inset: 20px; animation-duration: 1.9s; border-top-color: #00ff88; }
.no-results { color: rgba(255,255,255,.75); }
.cinema-hall-container, .auth-container, .new-contact-container {
  max-width: 1400px;
  margin: 0 auto;
}
.cinema-header, .auth-card, .contact-hero, .search-glow-box, .hero-copy, .comment-section {
  border-radius: 24px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(14px);
}
.cinema-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  margin-bottom: 1rem;
}
.playing-info h3 { margin: .35rem 0 0; color: #fff; }
.live-tag { color: #ff4d6d; font-weight: 800; letter-spacing: 1px; animation: pulseBadge 4s ease-in-out infinite; }
.exit-hall-btn, .back-btn, .auth-btn, .search-action-btn { font-weight: 800; }
.exit-hall-btn, .back-btn { padding: .9rem 1.1rem; border-radius: 14px; color: #fff; background: rgba(255,255,255,.08); }
.video-wrapper { position: relative; aspect-ratio: 16 / 9; width: 100%; overflow: hidden; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,.5); background: #000; }
.trailer-iframe { width: 100%; height: 100%; border: none; }
.cinema-info-stage {
  padding: 3rem 1.5rem;
  text-align: center;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(0,204,255,.06), rgba(255,0,68,.06));
  border: 1px solid rgba(255,255,255,.08);
}
.cinema-info-content {
  max-width: 400px;
  margin: 0 auto;
}
.cinema-playing-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 20px rgba(0,204,255,.3));
}
.cinema-info-content h2 {
  color: #fff;
  margin-bottom: .75rem;
}
.cinema-info-sub {
  color: rgba(255,255,255,.7);
  margin-bottom: 1.5rem;
}
.trailer-actions {
  display: flex;
  gap: .75rem;
  margin-top: .75rem;
  flex-wrap: wrap;
  justify-content: center;
}
.youtube-btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .7rem 1.4rem;
  border-radius: 12px;
  border: none;
  background: #ff0000;
  color: #fff;
  font-weight: 700;
  font-size: .9rem;
  cursor: pointer;
  transition: all .25s ease;
  box-shadow: 0 4px 16px rgba(255,0,0,.25);
}
.youtube-btn:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 28px rgba(255,0,0,.35);
}
.cinema-info-actions {
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
  justify-content: center;
}
.source-switcher {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-top: .75rem;
  flex-wrap: wrap;
  justify-content: center;
}
.source-label {
  color: rgba(255,255,255,.6);
  font-size: .85rem;
}
.source-switch-btn {
  padding: .5rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: #00ccff;
  cursor: pointer;
  transition: all .2s ease;
  font-size: .8rem;
}
.source-switch-btn:hover {
  background: rgba(0,204,255,.12);
  border-color: rgba(0,204,255,.3);
  transform: translateY(-1px);
}
.comment-section {
  margin-top: 1rem;
  padding: 1.2rem;
}
.comment-title {
  margin: 0 0 1rem;
  color: #fff;
}
.comment-form {
  display: grid;
  gap: .9rem;
  margin-bottom: 1rem;
}
.comment-list {
  display: grid;
  gap: .75rem;
}
.comment-item {
  padding: .9rem 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
}
.comment-item h4 {
  margin: 0 0 .35rem;
  color: #00ff88;
}
.comment-item p {
  margin: 0;
  color: rgba(255,255,255,.8);
  white-space: pre-wrap;
}
.auth-container { padding: 1rem 0; }
.auth-card { padding: 1.25rem; max-width: 520px; margin: 0 auto; }
.auth-tabs { display: flex; gap: .75rem; margin-bottom: 1rem; }
.tab-btn { flex: 1; padding: .9rem 1rem; border-radius: 14px; color: #fff; background: rgba(255,255,255,.08); }
.auth-forms { display: flex; flex-direction: column; gap: 1rem; }
.auth-form { display: grid; gap: .9rem; }
.input-group { position: relative; }
.password-group { position: relative; }
.password-toggle {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  border: none;
  background: rgba(255,255,255,0.12);
  color: #fff;
  padding: .45rem .9rem;
  border-radius: 999px;
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
  font-size: .85rem;
}
.password-toggle:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-50%) scale(1.02);
}
.glow-input {
  width: 100%;
  padding: 1rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.1);
  outline: none;
  background: rgba(255,255,255,.05);
  color: #fff;
}
.input-glow { position: absolute; inset: auto 0 0 0; height: 2px; background: linear-gradient(90deg, transparent, #00ccff, #ff0044, transparent); opacity: .8; }
.auth-btn.primary { padding: 1rem; border-radius: 14px; background: linear-gradient(135deg, #00ccff, #00ff88); color: #001018; }
.forgot-password { text-align: center; margin: .25rem 0 0; }
.forgot-link { background: none; color: #00ccff; text-decoration: underline; padding: 0; }
.demo-info, .success-message, .error-message { text-align: center; }
.demo-link { color: #00ff88; cursor: pointer; }
.success-message { color: #00ff88; font-weight: 700; }
.error-message { color: #ff6b8b; font-weight: 700; }
.contact-hero { padding: 2rem 1.5rem; margin-bottom: 1.5rem; text-align: center; background: linear-gradient(135deg, rgba(0,204,255,.15), rgba(255,0,68,.12)); border-radius: 28px; box-shadow: 0 20px 80px rgba(0,204,255,.12); }
.contact-hero .hero-title { font-size: clamp(2rem, 4vw, 3rem); letter-spacing: 0.02em; }
.contact-hero .hero-subtitle { color: rgba(255,255,255,.8); }
.contact-orbit-container { display: flex; flex-wrap: wrap; gap: 2rem; justify-content: center; margin-bottom: 1.5rem; }
.contact-orbit-item {
  position: relative;
  min-height: 200px;
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  border-radius: 20px;
  animation: contactFloat 6s ease-in-out infinite;
}
.contact-orbit-item:nth-child(1) { animation-delay: 0s; }
.contact-orbit-item:nth-child(2) { animation-delay: 1.5s; }
.contact-orbit-item:nth-child(3) { animation-delay: 3s; }
.contact-orbit-item:nth-child(4) { animation-delay: 4.5s; }
.contact-orbit-item::before {
  content: '';
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle at center, rgba(0,255,136,.16), transparent 40%);
  filter: blur(24px);
  opacity: 0.7;
  transition: opacity .3s ease;
}
.contact-orbit-item:hover::before { opacity: 1; }
.orbit-ring {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.3);
  animation: orbitSpin 10s linear infinite;
}
.contact-item {
  position: relative;
  z-index: 2;
  width: 160px;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0,255,204,.22), rgba(255,0,68,.16));
  border: 2px solid rgba(255,255,255,.16);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 60px rgba(0,204,255,.12);
  transition: transform .3s ease, box-shadow .3s ease;
}
.contact-orbit-item:hover .contact-item { transform: scale(1.1) rotate(5deg); box-shadow: 0 30px 80px rgba(0,204,255,.22); }
.contact-icon { font-size: 3rem; margin-bottom: 0.5rem; animation: iconBounce 2s ease-in-out infinite; }
.contact-item h3 { margin: 0.5rem 0 0.25rem; color: #fff; font-size: 1.2rem; }
.contact-item p { margin: 0; color: rgba(255,255,255,.82); font-size: 0.9rem; }
.login-required-card {
  padding: 2rem;
  border-radius: 24px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.14);
  backdrop-filter: blur(16px);
  text-align: center;
  margin-bottom: 1.5rem;
}
.login-required-card h2 { margin-bottom: 0.75rem; }
.login-required-card p { color: rgba(255,255,255,.78); margin-bottom: 1.25rem; }
.login-link {
  background: none;
  border: none;
  color: #00ff88;
  text-decoration: underline;
  cursor: pointer;
}
.comment-login-prompt {
  margin-bottom: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 18px;
  background: rgba(0,204,255,.08);
  border: 1px solid rgba(0,204,255,.18);
  color: #e8f9ff;
}
.comment-login-prompt p { margin: 0; }

.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #0a0b1e 0%, #1a1b2e 50%, #010204 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.login-splash {
  position: relative;
  text-align: center;
  padding: 2rem;
  max-width: 600px;
  z-index: 10;
}

.splash-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.splash-star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
}

.splash-content {
  position: relative;
  z-index: 20;
}

.splash-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: #fff;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #00ccff, #ff0044, #8a2be2, #00ff88);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: colorShift 8s ease infinite;
}

.splash-subtitle {
  font-size: 1.2rem;
  color: rgba(255,255,255,.8);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.splash-btn {
  padding: 1.2rem 2rem;
  border-radius: 50px;
  background: linear-gradient(135deg, #00ccff, #00ff88);
  color: #001018;
  font-weight: 800;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease;
  margin-right: 1rem;
}

.splash-btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 20px 40px rgba(0,204,255,.3);
}

.splash-secondary {
  padding: 1rem 1.5rem;
  border-radius: 50px;
  background: rgba(255,255,255,.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,.2);
  cursor: pointer;
  transition: transform .3s ease;
}

.splash-secondary:hover {
  transform: translateY(-2px);
  background: rgba(255,255,255,.15);
}

.theme-label {
  color: #fff;
  margin-bottom: 0.5rem;
  display: block;
}

@keyframes colorShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulseRing { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 0.95; } }
@keyframes floatContact { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

@media (max-width: 768px) {
  .header-inner { flex-direction: column; align-items: flex-start; }
  .search-glow-box { flex-direction: column; }
  .movie-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .hero-poster { flex-basis: 100px; height: 150px; }
}

/* New styles for additional features */
.profile-container, .watchlists-container, .movie-details-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.profile-card, .watchlists-card, .movie-details-card, .merch-hero, .faq-hero {
  border-radius: 24px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(14px);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.profile-form, .watchlist-form {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.profile-sections {
  display: grid;
  gap: 2rem;
}

.profile-section h3, .cast-section h3, .similar-section h3, .reviews-section h3 {
  color: #00ff88;
  margin-bottom: 1rem;
}

.history-list, .reviews-list {
  display: grid;
  gap: 0.75rem;
}

.history-item, .review-item {
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
}

.favorites-grid, .rec-grid, .similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.fav-card, .rec-card, .similar-card {
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .25s ease;
}

.fav-card:hover, .rec-card:hover, .similar-card:hover {
  transform: translateY(-4px);
}

.fav-card img, .rec-card img, .similar-card img {
  width: 100%;
  height: 225px;
  object-fit: cover;
}

.watchlists-list {
  display: grid;
  gap: 1rem;
}

.watchlist-item {
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
}

.list-movies {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.list-movie {
  flex: 0 0 100px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.list-movie img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.no-poster-small {
  width: 100%;
  height: 150px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(0,204,255,.2), rgba(255,0,68,.2));
  color: #fff;
  font-size: 0.8rem;
  text-align: center;
  padding: 0.5rem;
}

.movie-header {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.movie-poster {
  width: 100%;
  border-radius: 16px;
}

.movie-info h2 {
  color: #fff;
  margin-bottom: 1rem;
}

.movie-info p {
  color: rgba(255,255,255,.8);
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.details-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cast-list {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 0;
}

.cast-item {
  flex: 0 0 150px;
  text-align: center;
}

.cast-item img {
  width: 100%;
  height: 225px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 0.5rem;
}

.faq-answer {
  margin-top: 0.85rem;
  color: rgba(255,255,255,.82);
  line-height: 1.7;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.3s ease;
  visibility: hidden;
}

.faq-answer.open {
  max-height: 240px;
  opacity: 1;
  visibility: visible;
}

.admin-panel {
  border-radius: 24px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.admin-hero {
  margin-bottom: 1.5rem;
}

.admin-hero h2 {
  margin: 0 0 0.5rem;
}

.admin-hero p {
  color: rgba(255,255,255,0.75);
}

.admin-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.admin-card {
  padding: 1.2rem;
  background: rgba(0,204,255,0.12);
  border: 1px solid rgba(0,204,255,0.14);
  border-radius: 18px;
  text-align: center;
}

.admin-card h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.admin-card p {
  font-size: 2rem;
  margin: 0;
}

.admin-section {
  margin-bottom: 1.75rem;
}

.admin-user-list,
.movie-view-list {
  display: grid;
  gap: 1rem;
}

.admin-user-card,
.movie-view-item {
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.admin-empty {
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.75);
}

.advanced-filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.advanced-filters .glow-input {
  flex: 1;
  min-width: 120px;
}

.ai-chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
}

.chat-toggle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ccff, #00ff88);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,204,255,.3);
  transition: transform .3s ease, box-shadow .3s ease;
}

.chat-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(0,204,255,.4);
}

.chat-icon {
  font-size: 24px;
}

.chat-window {
  width: 350px;
  height: 500px;
  background: rgba(10,11,30,0.95);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255,255,255,.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
}

.chat-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background .2s ease;
}

.chat-close:hover {
  background: rgba(255,255,255,.1);
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-message {
  max-width: 80%;
}

.chat-message.user {
  align-self: flex-end;
}

.chat-message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.chat-message.user .message-content {
  background: linear-gradient(135deg, #00ccff, #00ff88);
  color: #001018;
}

.chat-message.assistant .message-content {
  background: rgba(255,255,255,.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,.1);
}

.chat-input-area {
  padding: 1rem;
  border-top: 1px solid rgba(255,255,255,.1);
  display: flex;
  gap: 0.5rem;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 25px;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(255,255,255,.05);
  color: #fff;
  outline: none;
  font-size: 0.9rem;
}

.chat-input::placeholder {
  color: rgba(255,255,255,.6);
}

.chat-send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ccff, #00ff88);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .2s ease;
}

.chat-send:hover:not(:disabled) {
  transform: scale(1.1);
}

.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .ai-chat-widget {
    bottom: 10px;
    right: 10px;
  }
  .chat-window {
    width: calc(100vw - 20px);
    height: calc(100vh - 100px);
    max-width: none;
  }
}

.app-footer {
  background: linear-gradient(180deg, rgba(5,7,25,0.95) 0%, rgba(10,11,30,0.95) 75%);
  border-top: 1px solid rgba(255,255,255,0.12);
  padding: 2rem 1rem 1rem;
  margin-top: 2rem;
  box-shadow: inset 0 1px 30px rgba(0,0,0,0.25);
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.75rem;
  margin-bottom: 1.5rem;
}

.footer-section {
  padding: 1.25rem 1rem;
  border-radius: 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  min-height: 180px;
}

.footer-section h4 {
  color: #70f9d9;
  margin-bottom: 1rem;
  font-size: 1.15rem;
  letter-spacing: 0.5px;
}

.footer-section p,
.footer-section li {
  color: rgba(255,255,255,0.82);
  margin-bottom: 0.65rem;
  line-height: 1.7;
}

.footer-section li {
  position: relative;
  padding-left: 1.4rem;
}

.footer-section li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #70f9d9;
  font-size: 0.9rem;
  top: 0.1rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-link {
  color: #bfe8ff;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.footer-link:hover {
  color: #ffe061;
  transform: translateX(2px);
}

.footer-theme-select {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: #fff;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
}

.footer-theme-select option {
  background: #0a0b1e;
  color: #fff;
}

.footer-cta-row {
  max-width: 1400px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1rem 0;
}

.footer-cta-text p {
  color: rgba(255,255,255,0.8);
  font-size: 0.98rem;
  margin: 0;
}

.footer-cta-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.footer-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.35rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(114, 255, 214, 0.12);
  color: #e8fbff;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.footer-cta-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
}

.footer-cta-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.3);
  background: rgba(114, 255, 214, 0.18);
}

.footer-bottom {
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 1rem;
}

.footer-bottom p {
  color: rgba(255,255,255,0.6);
  font-size: 0.9rem;
  margin: 0;
}

.download-options {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
}

.download-options h4 {
  margin: 0 0 1rem 0;
  color: #fff;
  font-size: 1.1rem;
}

.download-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.download-option {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0,204,255,.2), rgba(255,255,255,.1));
  color: #fff;
  border: 1px solid rgba(255,255,255,.15);
  cursor: pointer;
  transition: transform .25s ease, box-shadow .25s ease, background .25s ease;
  font-weight: 600;
  text-align: center;
}

.download-option:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0,204,255,.25);
  background: linear-gradient(135deg, rgba(0,204,255,.3), rgba(255,255,255,.15));
}

.download-note {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.05);
  font-size: 0.9rem;
  color: rgba(255,255,255,.7);
  line-height: 1.5;
}

/* ===== ADMIN PANEL STYLES ===== */
.admin-panel {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.admin-login-gate {
  max-width: 420px;
  margin: 4rem auto;
  padding: 2.5rem 2rem;
  border-radius: 24px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(16px);
  text-align: center;
}

.admin-lock-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 20px rgba(0,204,255,.3));
}

.admin-login-gate h2 {
  color: #fff;
  margin-bottom: .5rem;
}

.admin-login-gate > p {
  color: rgba(255,255,255,.7);
  margin-bottom: 1.5rem;
}

.admin-login-form {
  display: grid;
  gap: 1rem;
}

.admin-login-btn {
  margin-top: .5rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(0,204,255,.1), rgba(255,0,68,.08));
  border: 1px solid rgba(255,255,255,.1);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.admin-header-left h2 {
  margin: 0 0 .25rem;
  color: #fff;
  font-size: 1.4rem;
}

.admin-header-left p {
  margin: 0;
  color: rgba(255,255,255,.65);
  font-size: .9rem;
}

.admin-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-badge {
  padding: .45rem 1rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff0044, #ff7a00);
  color: #fff;
  font-size: .8rem;
  font-weight: 700;
  letter-spacing: .5px;
}

.admin-logout-btn {
  padding: .6rem 1.2rem;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.08);
  color: #fff;
  cursor: pointer;
  transition: all .2s ease;
}

.admin-logout-btn:hover {
  background: rgba(255,0,68,.2);
  border-color: rgba(255,0,68,.3);
}

.admin-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.admin-card {
  padding: 1.25rem;
  background: rgba(0,204,255,.08);
  border: 1px solid rgba(0,204,255,.12);
  border-radius: 18px;
  text-align: center;
  transition: transform .2s ease, box-shadow .2s ease;
}

.admin-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,204,255,.12);
}

.admin-card-icon {
  font-size: 2rem;
  margin-bottom: .5rem;
}

.admin-card h3 {
  margin: 0 0 .5rem;
  font-size: .85rem;
  color: rgba(255,255,255,.8);
  text-transform: uppercase;
  letter-spacing: .5px;
}

.admin-stat-number {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #00ccff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.admin-tabs {
  display: flex;
  gap: .5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding: .25rem;
  border-radius: 16px;
  background: rgba(255,255,255,.04);
}

.admin-tab {
  padding: .7rem 1.2rem;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,.7);
  cursor: pointer;
  transition: all .25s ease;
  white-space: nowrap;
  font-size: .9rem;
}

.admin-tab:hover {
  color: #fff;
  background: rgba(255,255,255,.06);
}

.admin-tab.active {
  background: linear-gradient(135deg, rgba(0,204,255,.2), rgba(255,0,68,.15));
  color: #fff;
  font-weight: 600;
}

.admin-section {
  margin-bottom: 1.75rem;
}

.admin-section h3 {
  color: #70f9d9;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.admin-search-bar {
  margin-bottom: 1rem;
}

.admin-user-list,
.admin-comment-list,
.admin-message-list,
.movie-view-list,
.activity-list {
  display: grid;
  gap: .75rem;
}

.admin-user-card,
.admin-comment-card,
.admin-message-card,
.movie-view-item,
.activity-item {
  padding: 1rem 1.2rem;
  border-radius: 16px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  transition: all .2s ease;
}

.admin-user-card:hover,
.admin-comment-card:hover,
.admin-message-card:hover {
  border-color: rgba(255,255,255,.15);
  background: rgba(255,255,255,.06);
}

.admin-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ccff, #00ff88);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #001018;
}

.admin-user-email {
  display: block;
  color: #fff;
  font-weight: 500;
}

.admin-user-date {
  display: block;
  font-size: .8rem;
  color: rgba(255,255,255,.55);
}

.admin-user-actions {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-top: .75rem;
}

.admin-user-role {
  padding: .25rem .75rem;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  background: rgba(0,204,255,.15);
  color: #00ccff;
}

.admin-user-role.admin {
  background: rgba(255,0,68,.15);
  color: #ff6b8b;
}

.admin-action-btn {
  padding: .45rem .7rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all .2s ease;
  font-size: .9rem;
}

.admin-action-btn.view {
  background: rgba(0,204,255,.12);
  color: #00ccff;
}

.admin-action-btn.delete {
  background: rgba(255,0,68,.12);
  color: #ff6b8b;
}

.admin-action-btn.reply {
  background: rgba(0,255,136,.12);
  color: #00ff88;
  padding: .6rem 1rem;
  font-weight: 600;
}

.admin-action-btn:hover {
  transform: scale(1.05);
  filter: brightness(1.2);
}

.admin-comment-header {
  display: flex;
  gap: .75rem;
  align-items: center;
  margin-bottom: .5rem;
  flex-wrap: wrap;
}

.admin-comment-header strong {
  color: #70f9d9;
}

.admin-comment-movie {
  color: rgba(255,255,255,.6);
  font-size: .85rem;
}

.admin-comment-card p {
  color: rgba(255,255,255,.85);
  line-height: 1.6;
  margin-bottom: .75rem;
}

.admin-message-card.unread {
  border-left: 3px solid #00ccff;
  background: rgba(0,204,255,.06);
}

.admin-message-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: .75rem;
  flex-wrap: wrap;
}

.admin-message-sender strong {
  display: block;
  color: #fff;
  margin-bottom: .2rem;
}

.admin-message-subject {
  color: rgba(255,255,255,.65);
  font-size: .85rem;
}

.admin-message-meta {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.admin-message-meta small {
  color: rgba(255,255,255,.5);
}

.admin-message-body {
  color: rgba(255,255,255,.8);
  line-height: 1.6;
  margin-bottom: .75rem;
  padding: .75rem;
  background: rgba(255,255,255,.03);
  border-radius: 12px;
}

.admin-message-reply {
  display: flex;
  gap: .5rem;
}

.admin-message-reply .glow-input {
  flex: 1;
  padding: .6rem 1rem;
  font-size: .85rem;
}

.movie-view-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.movie-view-title {
  color: #fff;
  font-weight: 500;
}

.movie-view-count {
  color: #00ff88;
  font-weight: 700;
  font-size: 1.1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.activity-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.05);
  border-radius: 12px;
}

.activity-detail span {
  display: block;
  color: rgba(255,255,255,.85);
}

.activity-detail small {
  color: rgba(255,255,255,.5);
  font-size: .8rem;
}

.admin-empty {
  padding: 2rem;
  text-align: center;
  border-radius: 16px;
  background: rgba(255,255,255,.03);
  color: rgba(255,255,255,.55);
  border: 1px dashed rgba(255,255,255,.1);
}

/* ===== CONTACT ADMIN STYLES ===== */
.contact-admin-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.contact-admin-card {
  padding: 2rem;
  border-radius: 24px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(16px);
}

.contact-admin-card h2 {
  color: #fff;
  margin: 0 0 .5rem;
}

.contact-admin-card > p {
  color: rgba(255,255,255,.7);
  margin-bottom: 1.5rem;
}

.admin-message-form {
  display: grid;
  gap: 1rem;
}

.admin-message-form textarea {
  resize: vertical;
  min-height: 120px;
}

@media (max-width: 768px) {
  .footer-cta-row {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-cta-buttons {
    justify-content: flex-start;
  }

  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
}

</style>