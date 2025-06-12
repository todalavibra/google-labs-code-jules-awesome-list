package com.example.myapp.presentation.ui

import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.myapp.R
import com.example.myapp.domain.model.Skin

class SkinsActivity : AppCompatActivity() {

    private lateinit var viewModel: MainViewModel
    private lateinit var skinsRecyclerView: RecyclerView
    private lateinit var skinAdapter: SkinAdapter // To be created
    private lateinit var currentCoinsTextView: TextView
    private lateinit var backButton: Button

    private var soundPool: SoundPool? = null
    private var buttonClickSoundId: Int = 0
    private var itemUnlockedSoundId: Int = 0


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_skins)

        viewModel = ViewModelProvider(this).get(MainViewModel::class.java)

        currentCoinsTextView = findViewById(R.id.currentCoinsTextViewSkins)
        backButton = findViewById(R.id.backButtonSkins)

        setupSoundPool()
        loadSounds()
        setupRecyclerView()
        observeViewModel()

        backButton.setOnClickListener {
            playSound(buttonClickSoundId)
            finish()
        }
    }

    private fun setupRecyclerView() {
        skinsRecyclerView = findViewById(R.id.skinsRecyclerView)
        skinAdapter = SkinAdapter(
            onUnlockClicked = { skin ->
                playSound(buttonClickSoundId)
                if (viewModel.unlockSkin(skin.id)) {
                    playSound(itemUnlockedSoundId)
                    Toast.makeText(this, "${skin.name} Unlocked!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Not enough coins or already unlocked!", Toast.LENGTH_SHORT).show()
                }
            },
            onSelectClicked = { skin ->
                playSound(buttonClickSoundId)
                viewModel.selectSkin(skin.id)
                Toast.makeText(this, "${skin.name} Selected!", Toast.LENGTH_SHORT).show()
                // Adapter will update based on LiveData observation for selected state
            }
        )
        skinsRecyclerView.adapter = skinAdapter
        // Using GridLayoutManager for a more skin-selection friendly UI
        skinsRecyclerView.layoutManager = GridLayoutManager(this, 3) // 3 items per row
    }

    private fun observeViewModel() {
        viewModel.objectSkins.observe(this, Observer { skins ->
            skinAdapter.submitList(skins)
        })

        viewModel.currentCoins.observe(this, Observer { coins ->
            currentCoinsTextView.text = "Coins: $coins"
            skinAdapter.setCurrentCoins(coins)
            // Could call notifyDataSetChanged or more specific updates if needed for button states
        })

        viewModel.selectedSkinId.observe(this, Observer { selectedId ->
            skinAdapter.setSelectedSkinId(selectedId)
            // Adapter needs to handle highlighting the selected item
        })
    }

    private fun setupSoundPool() {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        soundPool = SoundPool.Builder()
            .setMaxStreams(2)
            .setAudioAttributes(audioAttributes)
            .build()
    }

    private fun loadSounds() {
        soundPool?.let {
            buttonClickSoundId = it.load(this, R.raw.button_click, 1)
            itemUnlockedSoundId = it.load(this, R.raw.upgrade_purchased, 1) // Re-use upgrade sound for unlock
        }
    }

    private fun playSound(soundId: Int) {
        if (soundId > 0) {
            soundPool?.play(soundId, 0.8f, 0.8f, 1, 0, 1f)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        soundPool?.release()
        soundPool = null
    }
}
