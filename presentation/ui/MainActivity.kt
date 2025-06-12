package com.example.myapp.presentation.ui

import android.app.Activity
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioAttributes
import android.media.SoundPool
import android.net.ConnectivityManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import com.example.myapp.R
import com.example.myapp.util.ConnectivityReceiver
import com.example.myapp.util.NetworkUtils

class MainActivity : AppCompatActivity(), GameView.GameOverListener {

    private lateinit var gameView: GameView
    private lateinit var scoreTextView: TextView
    private lateinit var boosterStatusTextView: TextView
    private lateinit var playPauseButton: ImageButton
    private lateinit var dailyRewardButton: ImageButton
    private lateinit var upgradesButton: ImageButton
    private lateinit var skinsButton: ImageButton
    private lateinit var testBoosterButton: Button
    private lateinit var viewModel: MainViewModel

    private var soundPool: SoundPool? = null
    private var buttonClickSoundId: Int = 0
    private lateinit var connectivityReceiver: ConnectivityReceiver
    private var isNetworkDialogShowing = false
    private var wasGameActiveBeforeNetworkLoss = false
    private var gameOverCountForInterstitial = 0
    private var observeViewModelCalledFirstTime = false


    private val handler = Handler(Looper.getMainLooper())
    private val scoreUpdateRunnable = object : Runnable {
        override fun run() {
            if (::gameView.isInitialized && ::scoreTextView.isInitialized && ::viewModel.isInitialized) {
                 scoreTextView.text = "Score: ${gameView.getScore()} | Coins: ${viewModel.currentCoins.value ?: 0}"
            }
            if (::viewModel.isInitialized && viewModel.boosterActive.value == true) {
                viewModel.updateBoosterTimeRemaining()
            }
            handler.postDelayed(this, 100)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        viewModel = ViewModelProvider(this).get(MainViewModel::class.java)

        gameView = findViewById(R.id.gameView)
        scoreTextView = findViewById(R.id.scoreTextView)
        boosterStatusTextView = findViewById(R.id.boosterStatusTextView)
        playPauseButton = findViewById(R.id.playPauseButton)
        dailyRewardButton = findViewById(R.id.dailyRewardButton)
        upgradesButton = findViewById(R.id.upgradesButton)
        skinsButton = findViewById(R.id.skinsButton)
        testBoosterButton = findViewById(R.id.testBoosterButton)

        setupSoundPool()
        loadSounds()

        if (!NetworkUtils.isInternetAvailable(this)) {
            showInternetRequiredDialog(isOnCreate = true)
        } else {
            initializeGameUiAndObservers()
        }
        setupConnectivityReceiver()
    }

    private fun setupConnectivityReceiver() {
        connectivityReceiver = ConnectivityReceiver()
        ConnectivityReceiver.networkState.observe(this, Observer { isConnected ->
            if (isConnected) {
                if (isNetworkDialogShowing) {
                    isNetworkDialogShowing = false
                    initializeGameUiAndObservers()
                    if (wasGameActiveBeforeNetworkLoss) {
                        gameView.resumeGame()
                        wasGameActiveBeforeNetworkLoss = false
                    }
                }
                if (gameView.visibility == View.GONE && !playPauseButton.isEnabled) {
                    initializeGameUiAndObservers()
                }
            } else {
                if (playPauseButton.isEnabled || gameView.visibility == View.VISIBLE) {
                    wasGameActiveBeforeNetworkLoss = gameView.isGameRunning
                    gameView.pauseGame()
                    showInternetLostDialog()
                } else if (!isNetworkDialogShowing && gameView.visibility == View.GONE) {
                    showInternetRequiredDialog(isOnCreate = true)
                }
            }
        })
    }

    private fun initializeGameUiAndObservers() {
        if (!NetworkUtils.isInternetAvailable(this)) {
            if (!isNetworkDialogShowing) showInternetRequiredDialog(isOnCreate = true)
            return
        }

        viewModel.fetchUserCountryAndSetAdStrategy()

        gameView.setGameOverListener(this)
        gameView.visibility = View.VISIBLE
        playPauseButton.isEnabled = true
        dailyRewardButton.isEnabled = true
        upgradesButton.isEnabled = true
        skinsButton.isEnabled = true
        testBoosterButton.isEnabled = true

        if (!observeViewModelCalledFirstTime) {
            observeViewModel()
            observeViewModelCalledFirstTime = true
        }
        viewModel.checkDailyRewardAvailability()
        viewModel.checkBoosterStatus()

        playPauseButton.setOnClickListener {
            playSound(buttonClickSoundId)
            if (!NetworkUtils.isInternetAvailable(this)) {
                showInternetRequiredDialog(isFromPlayButton = true)
            } else {
                if (gameView.isGameRunning) {
                    gameView.pauseGame()
                    // TODO: Update button icon to "Play"
                } else {
                    viewModel.upgrades.value?.forEach { _, item ->
                         if (item.id == "faster_blades" || item.id == "more_blades" || (item.id == "bubble_shred" && item.isAdUnlocked && item.currentLevel > 0)) {
                            if(::gameView.isInitialized) gameView.setUpgradeEffect(item.id, item.effectValue)
                         }
                    }
                    if(::gameView.isInitialized) gameView.resetGameAndScore()
                    viewModel.updateScore(0)
                    // TODO: Update button icon to "Pause"
                }
            }
        }

        upgradesButton.setOnClickListener {
            playSound(buttonClickSoundId)
            val intent = Intent(this, UpgradesActivity::class.java)
            upgradesActivityResultLauncher.launch(intent)
        }

        skinsButton.setOnClickListener {
            playSound(buttonClickSoundId)
            val intent = Intent(this, SkinsActivity::class.java)
            startActivity(intent)
        }

        dailyRewardButton.setOnClickListener {
            playSound(buttonClickSoundId)
            if (viewModel.dailyRewardAvailable.value == true) {
                if (viewModel.claimDailyReward()) {
                    Toast.makeText(this, "You received 500 coins!", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "Daily reward not available yet!", Toast.LENGTH_SHORT).show()
            }
        }

        testBoosterButton.setOnClickListener {
            playSound(buttonClickSoundId)
            viewModel.activateCoinBooster(2.0f, 60000L)
            Toast.makeText(this, "2x Coin Booster Activated for 1 min!", Toast.LENGTH_SHORT).show()
        }
    }

    private val upgradesActivityResultLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { _ ->
        if (!viewModel.interstitialShownThisSession) {
            viewModel.requestLoadInterstitialAd()
        }
    }

    private fun showInternetRequiredDialog(isOnCreate: Boolean = false, isFromPlayButton: Boolean = false) {
        if (isNetworkDialogShowing) return
        isNetworkDialogShowing = true

        gameView.visibility = View.GONE
        playPauseButton.isEnabled = false
        dailyRewardButton.isEnabled = false
        upgradesButton.isEnabled = false
        skinsButton.isEnabled = false
        testBoosterButton.isEnabled = false
        boosterStatusTextView.visibility = View.GONE

        AlertDialog.Builder(this)
            .setTitle(getString(R.string.app_name))
            .setMessage(getString(R.string.internet_required_message))
            .setCancelable(false)
            .setPositiveButton(getString(R.string.retry_button_text)) { dialog, _ ->
                isNetworkDialogShowing = false
                dialog.dismiss()
                if (NetworkUtils.isInternetAvailable(this)) {
                    initializeGameUiAndObservers()
                } else {
                    showInternetRequiredDialog(isOnCreate = isOnCreate, isFromPlayButton = isFromPlayButton)
                }
            }
            .show()
    }

    private fun showInternetLostDialog() {
        if (isNetworkDialogShowing) return
        isNetworkDialogShowing = true

        playPauseButton.isEnabled = false

        AlertDialog.Builder(this)
            .setTitle(getString(R.string.app_name))
            .setMessage(getString(R.string.internet_lost_message))
            .setCancelable(false)
            .setPositiveButton(getString(R.string.ok_button_text)) { dialog, _ ->
                isNetworkDialogShowing = false
                dialog.dismiss()
                if (NetworkUtils.isInternetAvailable(this)) {
                    initializeGameUiAndObservers()
                } else {
                    showInternetLostDialog()
                }
            }
            .show()
    }

    override fun onGameOver(sessionScore: Int) {
        viewModel.updateScore(sessionScore)
        gameOverCountForInterstitial++

        AlertDialog.Builder(this)
            .setTitle("Game Over!")
            .setMessage("Score: $sessionScore\nWatch an Ad to Double Your Coins?")
            .setPositiveButton("Yes, Double Coins!") { dialog, _ ->
                playSound(buttonClickSoundId)
                dialog.dismiss()
                viewModel.requestLoadRewardedVideo()
            }
            .setNegativeButton("No, Thanks") { dialog, _ ->
                playSound(buttonClickSoundId)
                dialog.dismiss()
                viewModel.addCoins(sessionScore)
                checkAndShowInterstitialAfterGameOver()
            }
            .setCancelable(false)
            .show()
    }

    private fun checkAndShowInterstitialAfterGameOver() {
        if (gameOverCountForInterstitial % 2 == 0) {
            if (!viewModel.interstitialShownThisSession) {
                viewModel.requestLoadInterstitialAd()
            }
        }
    }

    private fun observeViewModel() {
        viewModel.rewardedAdLoaded.observe(this) { isLoaded ->
            if (isLoaded == true) {
                viewModel.requestShowRewardedVideo(
                    onRewarded = { _ ->
                        val lastSessionScore = viewModel.score.value ?: 0
                        viewModel.addCoins(lastSessionScore)
                        Toast.makeText(this, "Coins Doubled!", Toast.LENGTH_SHORT).show()
                        checkAndShowInterstitialAfterGameOver()
                    },
                    onClosed = {
                        if(!NetworkUtils.isInternetAvailable(this)){
                            showInternetLostDialog()
                        } else {
                           // Interstitial check is handled by onRewarded or if ad is closed without reward by NegativeButton
                        }
                    }
                )
            }
        })

        viewModel.interstitialAdLoaded.observe(this) { isLoaded ->
            if (isLoaded == true) {
                if (!isFinishing && !isChangingConfigurations) {
                    gameView.pauseGame()
                    viewModel.requestShowInterstitialAd {
                        gameView.resumeGame()
                    }
                }
            }
        }

        viewModel.currentCoins.observe(this) { coins ->
             scoreTextView.text = "Score: ${gameView.getScore()} | Coins: $coins"
        }

        viewModel.upgrades.observe(this) { upgradesMap ->
            if (::gameView.isInitialized) {
                upgradesMap.forEach { _, upgradeItem ->
                    if (upgradeItem.id == "faster_blades" || upgradeItem.id == "more_blades" ||
                        (upgradeItem.id == "bubble_shred" && upgradeItem.isAdUnlocked && upgradeItem.currentLevel > 0)) {
                        gameView.setUpgradeEffect(upgradeItem.id, upgradeItem.effectValue)
                    }
                }
            }
        })

        viewModel.dailyRewardAvailable.observe(this) { available ->
            if (available) {
                dailyRewardButton.isEnabled = true
                dailyRewardButton.alpha = 1.0f
                // TODO: Add animation to make button prominent
            } else {
                dailyRewardButton.isEnabled = false
                dailyRewardButton.alpha = 0.5f
            }
        }

        viewModel.boosterActive.observe(this) { isActive ->
            if (isActive) {
                boosterStatusTextView.visibility = View.VISIBLE
                viewModel.updateBoosterTimeRemaining()
            } else {
                boosterStatusTextView.visibility = View.GONE
            }
        }
        viewModel.boosterTimeRemaining.observe(this) { timeString ->
            if (viewModel.boosterActive.value == true && timeString.isNotBlank()) {
                val multiplierText = String.format("%.0fx", viewModel.coinMultiplier.value ?: 1.0f)
                boosterStatusTextView.text = "$multiplierText Coins Active! $timeString"
            } else {
                 boosterStatusTextView.visibility = View.GONE
            }
        }

        viewModel.selectedSkinId.observe(this) { skinId ->
            Log.d("MainActivity", "Selected skin ID changed to: $skinId")
            if(::gameView.isInitialized && skinId != null) gameView.setSelectedSkinId(skinId)
        }
    }

    private fun setupSoundPool() {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        soundPool = SoundPool.Builder()
            .setMaxStreams(3)
            .setAudioAttributes(audioAttributes)
            .build()
    }

    private fun loadSounds() {
        soundPool?.let {
            buttonClickSoundId = it.load(this, R.raw.button_click, 1)
        }
    }

    private fun playSound(soundId: Int) {
        if (soundId > 0) {
            soundPool?.play(soundId, 0.8f, 0.8f, 1, 0, 1f)
        }
    }

    override fun onResume() {
        super.onResume()
        handler.post(scoreUpdateRunnable)

        @Suppress("DEPRECATION")
        registerReceiver(connectivityReceiver, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION))

        if (!NetworkUtils.isInternetAvailable(this) && !isNetworkDialogShowing) {
            if(playPauseButton.isEnabled || gameView.visibility == View.VISIBLE){
                gameView.pauseGame()
                showInternetLostDialog()
            } else {
                 showInternetRequiredDialog(true)
            }
        } else if (NetworkUtils.isInternetAvailable(this) &&
                   (gameView.visibility == View.GONE && !playPauseButton.isEnabled && !isNetworkDialogShowing)){
            initializeGameUiAndObservers()
        } else if (NetworkUtils.isInternetAvailable(this) && ::viewModel.isInitialized) {
            viewModel.checkDailyRewardAvailability()
            viewModel.checkBoosterStatus()

            viewModel.upgrades.value?.forEach { _, item ->
                if (item.id == "faster_blades" || item.id == "more_blades" || (item.id == "bubble_shred" && item.isAdUnlocked && item.currentLevel > 0)) {
                    if(::gameView.isInitialized) gameView.setUpgradeEffect(item.id, item.effectValue)
                }
            }
            if (!observeViewModelCalledFirstTime) {
                observeViewModel()
                observeViewModelCalledFirstTime = true
            }
        }
    }

    override fun onPause() {
        super.onPause()
        handler.removeCallbacks(scoreUpdateRunnable)

        unregisterReceiver(connectivityReceiver)
    }

    override fun onDestroy() {
        super.onDestroy()
        soundPool?.release()
        soundPool = null
    }
}
