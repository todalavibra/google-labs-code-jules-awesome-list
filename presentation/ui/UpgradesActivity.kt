package com.example.myapp.presentation.ui

import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.myapp.R
import com.example.myapp.domain.model.UpgradeItem

class UpgradesActivity : AppCompatActivity() {

    private var soundPool: SoundPool? = null
    private var buttonClickSoundId: Int = 0
    private var upgradePurchasedSoundId: Int = 0 // New
    private var powerUpActivatedSoundId: Int = 0 // New
    private lateinit var viewModel: MainViewModel

    private lateinit var upgradesRecyclerView: RecyclerView
    private lateinit var upgradeAdapter: UpgradeAdapter
    private lateinit var currentCoinsTextView: TextView


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_upgrades)

        viewModel = ViewModelProvider(this).get(MainViewModel::class.java)

        setupSoundPool()
        loadSounds()

        currentCoinsTextView = findViewById(R.id.currentCoinsTextView)
        setupRecyclerView()
        observeViewModel()

        val backButton: Button = findViewById(R.id.backButton)
        backButton.setOnClickListener {
            playSound(buttonClickSoundId)
            finish()
        }
    }

    private fun setupRecyclerView() {
        upgradesRecyclerView = findViewById(R.id.upgradesRecyclerView)
        upgradeAdapter = UpgradeAdapter(
            onUpgradeClicked = { item ->
                playSound(buttonClickSoundId)
                if (viewModel.purchaseUpgrade(item.id)) {
                    playSound(upgradePurchasedSoundId) // Play purchase sound
                    Toast.makeText(this, "${item.name} Upgraded!", Toast.LENGTH_SHORT).show()
                } else {
                    val cost = item.getNextLevelCost()
                    if (cost != null && (viewModel.currentCoins.value ?: 0) < cost) {
                         Toast.makeText(this, "Not enough coins!", Toast.LENGTH_SHORT).show()
                    } else if (!item.isMaxLevel()){
                         Toast.makeText(this, "Cannot upgrade at this time.", Toast.LENGTH_SHORT).show()
                    }
                }
            },
            onUnlockAdClicked = { item ->
                playSound(buttonClickSoundId)
                AlertDialog.Builder(this)
                    .setTitle("Unlock ${item.name}")
                    .setMessage("Watch an Ad to unlock '${item.name}' for free?")
                    .setPositiveButton("Watch Ad") { dialog, _ ->
                        dialog.dismiss()
                        viewModel.requestLoadRewardedVideo()
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        )
        upgradesRecyclerView.adapter = upgradeAdapter
        upgradesRecyclerView.layoutManager = LinearLayoutManager(this)
    }

    private fun observeViewModel() {
        viewModel.upgrades.observe(this, Observer { upgradesMap ->
            upgradeAdapter.submitList(upgradesMap.values.toList().sortedBy { it.id })
        })

        viewModel.currentCoins.observe(this, Observer { coins ->
            currentCoinsTextView.text = "Coins: $coins"
            upgradeAdapter.setCurrentCoins(coins)
             if (upgradesRecyclerView.adapter != null) {
                upgradeAdapter.notifyDataSetChanged()
            }
        })

        viewModel.rewardedAdLoaded.observe(this, Observer { isLoaded ->
            if (isLoaded == true) {
                viewModel.requestShowRewardedVideo(
                    onRewarded = { _ ->
                        val adUnlockableItem = viewModel.upgrades.value?.values?.find { it.isUnlockedByAd && !it.isAdUnlocked }
                        adUnlockableItem?.let {
                            viewModel.unlockAdBasedUpgrade(it.id)
                            if (it.id == "bubble_shred") { // Specific sound for a power-up
                                playSound(powerUpActivatedSoundId)
                            } else { // Generic unlock/purchase sound
                                playSound(upgradePurchasedSoundId)
                            }
                            Toast.makeText(this, "${it.name} Unlocked!", Toast.LENGTH_SHORT).show()
                        } ?: Toast.makeText(this, "Reward received, but no specific upgrade to unlock found.", Toast.LENGTH_LONG).show()
                    },
                    onClosed = {
                        // Ad closed
                    }
                )
            }
        })
    }

    private fun setupSoundPool() {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        soundPool = SoundPool.Builder()
            .setMaxStreams(3) // Increased for more sounds
            .setAudioAttributes(audioAttributes)
            .build()
    }

    private fun loadSounds() {
        soundPool?.let {
            buttonClickSoundId = it.load(this, R.raw.button_click, 1)
            upgradePurchasedSoundId = it.load(this, R.raw.upgrade_purchased, 1)
            powerUpActivatedSoundId = it.load(this, R.raw.power_up_activated, 1)
        }
    }

    private fun playSound(soundId: Int) {
        if (soundId > 0) { // Check if soundId is loaded
             soundPool?.play(soundId, 0.8f, 0.8f, 1, 0, 1f) // Adjusted volume
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        soundPool?.release()
        soundPool = null
    }
}
