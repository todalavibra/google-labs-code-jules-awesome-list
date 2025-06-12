package com.example.myapp.presentation.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.example.myapp.R // For placeholder iconResId
import com.example.myapp.data.local.SharedPreferencesManager
import com.example.myapp.data.network.IpApiServiceImpl
import com.example.myapp.data.repository.GeoRepositoryImpl
import com.example.myapp.domain.model.AdNetworkStrategy
import com.example.myapp.domain.model.Skin
import com.example.myapp.domain.model.UpgradeItem
import com.example.myapp.domain.usecase.GetCountryUseCase
import com.example.myapp.presentation.ads.AdManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val prefsManager = SharedPreferencesManager(application.applicationContext)

    // Game Score
    private val _score = MutableLiveData<Int>(0) // Current game session score
    val score: LiveData<Int> = _score

    // Player Coins
    private val _currentCoins = MutableLiveData<Int>(prefsManager.getCurrentCoins())
    val currentCoins: LiveData<Int> = _currentCoins

    // Geolocation & Ad Strategy
    private val _userCountryCode = MutableLiveData<String?>()
    val userCountryCode: LiveData<String?> = _userCountryCode
    private val _adNetworkStrategy = MutableLiveData<AdNetworkStrategy>(AdNetworkStrategy.UNKNOWN)
    val adNetworkStrategy: LiveData<AdNetworkStrategy> = _adNetworkStrategy
    private var adManager: AdManager? = null

    // Upgrades
    private val _upgrades = MutableLiveData<Map<String, UpgradeItem>>(emptyMap())
    val upgrades: LiveData<Map<String, UpgradeItem>> = _upgrades

    // Ad States
    private val _rewardedAdLoaded = MutableLiveData<Boolean>(false)
    val rewardedAdLoaded: LiveData<Boolean> = _rewardedAdLoaded
    private val _interstitialAdLoaded = MutableLiveData<Boolean>(false)
    val interstitialAdLoaded: LiveData<Boolean> = _interstitialAdLoaded
    var interstitialShownThisSession = false

    // Daily Reward
    private val _dailyRewardAvailable = MutableLiveData<Boolean>(false)
    val dailyRewardAvailable: LiveData<Boolean> = _dailyRewardAvailable
    private var lastClaimTime: Long = prefsManager.getLastDailyRewardClaimTime()

    // Coin Booster
    private val _coinMultiplier = MutableLiveData<Float>(1.0f) // Default to 1.0f, load from prefs
    val coinMultiplier: LiveData<Float> = _coinMultiplier
    private var boosterEndTime: Long = 0L // Load from prefs
    private val _boosterActive = MutableLiveData<Boolean>(false)
    val boosterActive: LiveData<Boolean> = _boosterActive
    private val _boosterTimeRemaining = MutableLiveData<String>("")
    val boosterTimeRemaining: LiveData<String> = _boosterTimeRemaining
    private var boosterTimerJob: Job? = null

    // Skins
    private val _objectSkins = MutableLiveData<List<Skin>>(emptyList())
    val objectSkins: LiveData<List<Skin>> = _objectSkins
    private val _selectedSkinId = MutableLiveData<String?>()
    val selectedSkinId: LiveData<String?> = _selectedSkinId

    private val ipApiService = IpApiServiceImpl()
    private val geoRepository = GeoRepositoryImpl(ipApiService)
    private val getCountryUseCase = GetCountryUseCase(geoRepository)

    init {
        loadPersistedData()
        checkDailyRewardAvailability()
        checkBoosterStatus()
    }

    private fun loadPersistedData() {
        _currentCoins.value = prefsManager.getCurrentCoins()
        lastClaimTime = prefsManager.getLastDailyRewardClaimTime()

        // Load Upgrades
        val defaultUpgradesList = listOf(
             UpgradeItem(id = "faster_blades", name = "Faster Blades!", description = "Shred objects quicker.", iconResId = R.drawable.ic_placeholder_upgrade_item, maxLevel = 5, costs = listOf(100, 250, 500, 1000, 2000), effectValue = 1.0f),
             UpgradeItem(id = "more_blades", name = "Wider Shredder!", description = "Increases the width of the shredder.", iconResId = R.drawable.ic_placeholder_upgrade_item, maxLevel = 3, costs = listOf(150, 400, 800), effectValue = 1.0f),
             UpgradeItem(id = "bubble_shred", name = "Bubble Shred!", description = "Unlock the Bubble Shred power-up.", iconResId = R.drawable.ic_placeholder_upgrade_item, maxLevel = 1, costs = emptyList(), isUnlockedByAd = true, effectValue = 0f)
        )
        val loadedUpgrades = defaultUpgradesList.associate { defaultItem ->
            val savedLevel = prefsManager.getUpgradeLevel(defaultItem.id)
            val isAdUnlocked = if(defaultItem.isUnlockedByAd) savedLevel > 0 else false
            val currentEffect = when(defaultItem.id) {
                "faster_blades" -> 1.0f + (savedLevel * 0.2f)
                "more_blades" -> 1.0f + (savedLevel * 0.15f)
                "bubble_shred" -> if (isAdUnlocked) 1.0f else 0f
                else -> defaultItem.effectValue
            }
            defaultItem.id to defaultItem.copy(
                currentLevel = savedLevel,
                isAdUnlocked = isAdUnlocked,
                effectValue = currentEffect.toFloat()
            )
        }
        _upgrades.value = loadedUpgrades

        // Load Skins
        val unlockedSkinIds = prefsManager.getUnlockedSkinIds()
        _objectSkins.value = listOf(
            Skin("default", "Default", R.drawable.ic_placeholder_play, true, 0),
            Skin("red_block", "Red Blocks", R.drawable.ic_placeholder_upgrade_item, unlockedSkinIds.contains("red_block"), 50),
            Skin("blue_toy", "Blue Toys", R.drawable.ic_placeholder_upgrades, unlockedSkinIds.contains("blue_toy"), 50)
        )
        val savedSelectedSkin = prefsManager.getSelectedSkinId()
        if (_objectSkins.value?.any { it.id == savedSelectedSkin && it.isUnlocked } == true) {
            _selectedSkinId.value = savedSelectedSkin
        } else {
            _selectedSkinId.value = "default" // Fallback to default
        }

        // Load Booster
        _coinMultiplier.value = prefsManager.getBoosterMultiplier()
        boosterEndTime = prefsManager.getBoosterEndTime()
    }

    fun updateScore(sessionScore: Int) { _score.value = sessionScore }

    fun addCoins(amount: Int) {
        var actualAmount = amount.toFloat()
        if (System.currentTimeMillis() < boosterEndTime) {
            actualAmount *= (_coinMultiplier.value ?: 1.0f)
        }
        val newTotal = (_currentCoins.value ?: 0) + actualAmount.toInt()
        _currentCoins.value = newTotal
        prefsManager.saveCurrentCoins(newTotal)
    }

    fun spendCoins(amount: Int): Boolean {
        val current = _currentCoins.value ?: 0
        if (current >= amount) {
            val newTotal = current - amount
            _currentCoins.value = newTotal
            prefsManager.saveCurrentCoins(newTotal)
            return true
        }
        return false
    }

    fun purchaseUpgrade(upgradeId: String): Boolean {
        val currentUpgradesMap = _upgrades.value?.toMutableMap() ?: return false
        val item = currentUpgradesMap[upgradeId]?.copy() ?: return false

        if (item.isMaxLevel() || item.isUnlockedByAd) return false
        val cost = item.getNextLevelCost() ?: return false

        if (spendCoins(cost)) {
            item.currentLevel++
            item.effectValue = when(item.id) {
                "faster_blades" -> 1.0f + (item.currentLevel * 0.2f)
                "more_blades" -> 1.0f + (item.currentLevel * 0.15f)
                else -> item.effectValue
            }
            currentUpgradesMap[upgradeId] = item
            _upgrades.value = currentUpgradesMap
            prefsManager.saveUpgradeLevel(upgradeId, item.currentLevel)
            return true
        }
        return false
    }

    fun unlockAdBasedUpgrade(upgradeId: String) {
        val currentUpgradesMap = _upgrades.value?.toMutableMap() ?: return
        val item = currentUpgradesMap[upgradeId]?.copy() ?: return

        if (item.isUnlockedByAd && !item.isAdUnlocked) {
            item.isAdUnlocked = true
            item.currentLevel = 1
            item.effectValue = if (item.id == "bubble_shred") 1.0f else item.effectValue
            currentUpgradesMap[upgradeId] = item
            _upgrades.value = currentUpgradesMap
            prefsManager.saveUpgradeLevel(upgradeId, item.currentLevel) // Persist ad unlock as level 1
        }
    }

    fun checkDailyRewardAvailability() {
        val now = System.currentTimeMillis()
        val twentyHoursInMillis = TimeUnit.HOURS.toMillis(20) // For testing; use 24 for release
        _dailyRewardAvailable.value = now - lastClaimTime >= twentyHoursInMillis
    }

    fun claimDailyReward(): Boolean {
        if (_dailyRewardAvailable.value == true) {
            addCoins(500)
            lastClaimTime = System.currentTimeMillis()
            prefsManager.saveLastDailyRewardClaimTime(lastClaimTime)
            _dailyRewardAvailable.value = false
            return true
        }
        return false
    }

    fun activateCoinBooster(multiplier: Float, durationMillis: Long) {
        _coinMultiplier.value = multiplier
        boosterEndTime = System.currentTimeMillis() + durationMillis
        prefsManager.saveBoosterMultiplier(multiplier)
        prefsManager.saveBoosterEndTime(boosterEndTime)
        _boosterActive.value = true
        startBoosterTimer()
    }

    private fun checkBoosterStatus() {
        val now = System.currentTimeMillis()
        if (now >= boosterEndTime) {
            if (_boosterActive.value == true) { // Only update if it was active
                _coinMultiplier.value = 1.0f
                _boosterActive.value = false
                _boosterTimeRemaining.value = ""
                prefsManager.clearBooster()
            }
        } else {
            _boosterActive.value = true
            startBoosterTimer()
        }
    }

    private fun startBoosterTimer() {
        boosterTimerJob?.cancel() // Cancel any existing timer
        boosterTimerJob = viewModelScope.launch {
            while (System.currentTimeMillis() < boosterEndTime) {
                updateBoosterTimeRemaining()
                delay(1000) // Update every second
            }
            checkBoosterStatus() // Final check to clear booster state
        }
    }

    fun updateBoosterTimeRemaining() {
        if (System.currentTimeMillis() < boosterEndTime) {
            val remaining = boosterEndTime - System.currentTimeMillis()
            val minutes = TimeUnit.MILLISECONDS.toMinutes(remaining)
            val seconds = TimeUnit.MILLISECONDS.toSeconds(remaining) % 60
            _boosterTimeRemaining.value = String.format("%02d:%02d", minutes, seconds)
        } else {
            _boosterTimeRemaining.value = ""
        }
    }

    fun unlockSkin(skinId: String): Boolean {
        val skinToUnlock = _objectSkins.value?.find { it.id == skinId } ?: return false
        if (skinToUnlock.isUnlocked) return true
        if (spendCoins(skinToUnlock.unlockCost)) {
            val updatedSkins = _objectSkins.value?.map {
                if (it.id == skinId) it.copy(isUnlocked = true) else it
            }
            _objectSkins.value = updatedSkins ?: emptyList()
            prefsManager.saveUnlockedSkinIds(updatedSkins?.filter { it.isUnlocked }?.map { it.id }?.toSet() ?: emptySet())
            return true
        }
        return false
    }

    fun selectSkin(skinId: String) {
        val skinToSelect = _objectSkins.value?.find { it.id == skinId }
        if (skinToSelect != null && skinToSelect.isUnlocked) {
            _selectedSkinId.value = skinId
            prefsManager.saveSelectedSkinId(skinId)
        }
    }

    fun fetchUserCountryAndSetAdStrategy() {
        viewModelScope.launch {
            val countryCode = getCountryUseCase.execute()
            _userCountryCode.value = countryCode
            val strategy : AdNetworkStrategy
            if (countryCode != null && countryCode.equals("IR", ignoreCase = true)) {
                strategy = AdNetworkStrategy.IRANIAN_ADS
            } else if (countryCode != null && countryCode.isNotBlank()){
                strategy = AdNetworkStrategy.GLOBAL_ADS
            } else {
                strategy = AdNetworkStrategy.GLOBAL_ADS
                System.err.println("Country code not determined, defaulting to GLOBAL_ADS.")
            }
            _adNetworkStrategy.value = strategy
            adManager = AdManager(getApplication(), strategy)
            adManager?.initializeAds()
        }
    }

    fun requestLoadRewardedVideo() {
        _rewardedAdLoaded.value = false
        adManager?.loadRewardedVideoAd(
            onLoaded = { _rewardedAdLoaded.value = true },
            onFailed = { _rewardedAdLoaded.value = false }
        )
    }

    fun requestShowRewardedVideo(onRewarded: (rewardAmount: Int) -> Unit, onClosed: () -> Unit) {
        if (_rewardedAdLoaded.value == true) {
            adManager?.showRewardedVideoAd(
                onRewarded = { reward ->
                    onRewarded(reward)
                },
                onClosed = {
                    _rewardedAdLoaded.value = false
                    onClosed()
                }
            )
        } else {
            System.err.println("Rewarded Ad not loaded when trying to show.")
            onClosed()
        }
    }

    fun requestLoadInterstitialAd() {
        _interstitialAdLoaded.value = false
        adManager?.loadInterstitialAd(
            onLoaded = { _interstitialAdLoaded.value = true },
            onFailed = { _interstitialAdLoaded.value = false }
        )
    }

    fun requestShowInterstitialAd(onClosed: () -> Unit) {
        if (_interstitialAdLoaded.value == true) {
            adManager?.showInterstitialAd {
                _interstitialAdLoaded.value = false
                interstitialShownThisSession = true
                onClosed()
            }
        } else {
            System.err.println("Interstitial Ad not loaded when trying to show.")
            onClosed()
        }
    }

    override fun onCleared() {
        super.onCleared()
        boosterTimerJob?.cancel() // Clean up coroutine
    }
}
