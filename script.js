// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// xxxxxxxxx DOM Structure xxxxxxxxx
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const userInput = document.querySelector('#userInput');
const searchBtn = document.querySelector('#searchBtn');
const displaySearch = document.querySelector('.search-result');
const userCard = document.querySelector('.user-card');
const defaultText = document.querySelector('.default-text');
const languageFilter = document.querySelector('#language-filter');
const repoList = document.querySelector('#repo-list');
const filterSection = document.querySelector('.filter-section');
const searchIcon = document.querySelector('.search-icon');

let allRepository = [];


// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// xxxxxxxxx Debounce xxxxxxxxxxxxxx
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
function debounce(func, delay = 1000) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}


// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// xxxxxxxxx Logic Structure xxxxxxxxx
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

async function fetchUserData() {
  const username = userInput.value.trim();
  if (!username) {
    defaultText.textContent = 'Please enter a username';
  }
  console.log(username)

  defaultText.innerHTML = `
    <div class="loading" style="font-size: 3rem;">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </div>
  `;


  try {
    const [profileRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated`)
    ]);

    if (!profileRes.ok) {
      if (profileRes.status === 403) {
        userCard.innerHTML = `<p class="error">Rate limit exceded 😞! Please wait a few minutes and try again.</p>`;
      }else if (profileRes.status === 404) {
        userCard.innerHTML = `<p class="error">User "${username}" not found 😞.</p>`;
        if (userInput.value.trim()) debounce(fetchUserData(), 1000);
      } else {
        defaultText.innerHTML = `<p class="error">Error fetching data (${profileRes.status}) not found 😞.</p>`
      }

      return
    };

    const profileData = await profileRes.json();
    allRepository = await repoRes.json();

    displayProfile(profileData);
    populateRepository(allRepository);
    displayRepository(allRepository);


  } catch (error) {
    console.error('Error fetching data:', error);
    defaultText.innerHTML = `<p class="error">Error fetching data. Please try again later.</p>`;
    
  }
};

function displayProfile(user) {
  searchIcon.style.display = 'none';
  filterSection.style.display = 'flex';
  defaultText.innerHTML = '';
  displaySearch.innerHTML = `
    <div class="user-info">
      <img src="${user.avatar_url}" alt="${user.name || user.login}" width="100">
      <h2>${user.name || user.login}</h2>
      <p>${user.bio || 'No bio available'}</p>
      <p><strong>Followers:</strong> ${user.followers} | <strong>Public Repos:</strong> ${user.public_repos}</p>
    </div>
  `;
};

function populateRepository(repos) {
  const languages = [...new Set(repos.map(repo => repo.language).filter(Boolean))];

  let languagesOption = '<option value="all">All Languages</option>';
  languages.forEach(lang => {
    languagesOption += `<option value="${lang}">${lang}</option>`
  });

  languageFilter.innerHTML = languagesOption;
};

function displayRepository(repos) {
  if (!Array.isArray(repos) || repos.length === 0) {
    repoList.innerHTML = `<li>No repository found.</li>`;
    return;
  };

  repoList.innerHTML = repos.map(repo => `
      <li>
        <a href="${repo.html_url}" target="_blank"><strong>${repo.name}</strong></a>
        <span class="lang-tag" >${repo.language || 'No Language'}</span>
      </li>
    `).join('');
};

languageFilter.addEventListener('change', (e) => {
  const selectedLanguage = e.target.value;

  if (selectedLanguage === 'all') {
    displayRepository(allRepository);
  } else {
    const filteredRepos = allRepository.filter(repo => {
      const repoLang = repo.language || 'No Language';
      return repoLang === selectedLanguage;
    });
    displayRepository(filteredRepos);
  }
});



// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// xxxxxxxxx Event Listners xxxxxxxxxxxxxx
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
const debounceFetch = debounce(fetchUserData, 1000);

userInput.addEventListener('input', () => {
  if (userInput.value.trim()) {
    debounceFetch();
  }
});

searchBtn.addEventListener('click', fetchUserData);

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') fetchUserData();
});