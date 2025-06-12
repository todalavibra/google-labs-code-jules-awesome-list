package com.example.myapp.presentation.ui

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.media.AudioAttributes
import android.media.SoundPool
import android.util.AttributeSet
import android.util.Log // Added for logging
import android.view.View
import android.view.animation.LinearInterpolator
import com.example.myapp.R
import com.example.myapp.domain.model.FallingObject
import com.example.myapp.domain.model.ObjectType
import com.example.myapp.presentation.model.Particle // Import Particle
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.random.Random

class GameView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val objects = CopyOnWriteArrayList<FallingObject>()
    private val objectPaint = Paint()
    private val particlePaint = Paint() // Paint for particles
    private val shredderPaint = Paint().apply { color = Color.parseColor("#A1887F") } // Using color from colors.xml
    private var shredderRect = RectF()
    private var baseShredderWidth = 0f
    private var currentShredderWidth = 0f

    // Particle System
    private val particles = CopyOnWriteArrayList<Particle>()
    private val particleGravity = 0.3f // Adjusted gravity
    private val particleBaseLifetime = 50 // Avg frames a particle will last

    // Upgradeable parameters
    private var shredderSpeedFactor = 1.0f
    private var shredderWidthFactor = 1.0f

    // Skin
    private var currentSelectedSkinId: String? = "default"

    private var sessionScore = 0

    private var soundPool: SoundPool? = null
    private var shredSoundId: Int = 0
    var coinSoundId: Int = 0 // Made public for preloading if needed, or keep private

    private var lastSpawnTime = 0L
    private val spawnInterval = 1000L

    private var gameAnimator: ValueAnimator? = null
    var isGameRunning = false // Made public for MainActivity to check for play/pause logic

    init {
        setupSoundPool()
        addOnAttachStateChangeListener(object : OnAttachStateChangeListener {
            override fun onViewAttachedToWindow(v: View) {
                loadSounds()
                // startGameLoop() // Game shouldn't auto-start; let MainActivity control this via play button
            }

            override fun onViewDetachedFromWindow(v: View) {
                stopGameLoop()
                soundPool?.release()
                soundPool = null
            }
        })
    }

    private fun setupSoundPool() {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        soundPool = SoundPool.Builder()
            .setMaxStreams(10) // Increased streams for more simultaneous sounds
            .setAudioAttributes(audioAttributes)
            .build()
    }

    private fun loadSounds() {
        soundPool?.let { sp ->
            shredSoundId = sp.load(context, R.raw.shred_pop, 1)
            coinSoundId = sp.load(context, R.raw.coin_earned, 1) // Load coin sound
        }
    }

    fun startGameLoopIfNotRunning() {
        if (!isGameRunning) {
            resetGameVisuals() // Ensure game visuals are reset before starting
            startGameLoop()
        } else if (gameAnimator?.isPaused == true) {
            resumeGame()
        }
    }

    private fun resetGameVisuals() {
        objects.clear()
        particles.clear()
        // sessionScore is reset by MainActivity/ViewModel logic if needed before calling this
    }


    interface GameOverListener {
        fun onGameOver(sessionScore: Int)
    }
    private var gameOverListener: GameOverListener? = null
    fun setGameOverListener(listener: GameOverListener) {
        this.gameOverListener = listener
    }

    fun setSelectedSkinId(skinId: String?) {
        currentSelectedSkinId = skinId ?: "default"
        invalidate() // Redraw with new skin
    }

    fun setUpgradeEffect(upgradeId: String, effectValue: Float) {
        when (upgradeId) {
            "faster_blades" -> shredderSpeedFactor = effectValue.coerceAtLeast(0.5f)
            "more_blades" -> {
                shredderWidthFactor = effectValue.coerceAtLeast(0.5f)
                updateShredderRect()
            }
            "bubble_shred" -> {
                if (effectValue == 1.0f) {
                    Log.d("GameView", "Bubble Shred power-up is active (placeholder effect).")
                    // TODO: Implement actual visual or gameplay effect for bubble shred here
                }
            }
        }
    }

    fun getScore(): Int { return sessionScore }

    fun resetGameAndScore() { // Called by MainActivity to start a fresh game
        sessionScore = 0
        resetGameVisuals()
        isGameRunning = false
        startGameLoopIfNotRunning()
    }


    fun pauseGame() {
        isGameRunning = false
        gameAnimator?.pause()
    }

    fun resumeGame() {
        if (!isGameRunning && (gameAnimator?.isPaused == true || gameAnimator == null)) {
            isGameRunning = true
            if (gameAnimator == null) {
                startGameLoop() // If never started or was cancelled
            } else {
                gameAnimator?.resume()
            }
        }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        baseShredderWidth = w.toFloat()
        updateShredderRect()
    }

    private fun updateShredderRect() {
        val shredderHeight = height / 10f
        currentShredderWidth = baseShredderWidth * shredderWidthFactor
        val shredderLeft = (width - currentShredderWidth) / 2
        shredderRect = RectF(shredderLeft, height - shredderHeight, shredderLeft + currentShredderWidth, height.toFloat())
        invalidate()
    }

    private fun startGameLoop() {
        if (gameAnimator?.isRunning == true) return // Already running and not paused
        isGameRunning = true

        gameAnimator?.cancel()
        gameAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = Long.MAX_VALUE
            interpolator = LinearInterpolator()
            addUpdateListener {
                if(isGameRunning) {
                    updateGame()
                    invalidate()
                }
            }
            start()
        }
        lastSpawnTime = System.currentTimeMillis()
    }

    private fun stopGameLoop() {
        isGameRunning = false
        gameAnimator?.cancel()
    }

    private fun updateGame() {
        if (!isGameRunning) return

        val currentTime = System.currentTimeMillis()

        if (sessionScore >= 10 && isGameRunning) {
            isGameRunning = false
            gameAnimator?.pause()
            gameOverListener?.onGameOver(sessionScore)
            return
        }

        val objectIterator = objects.iterator()
        while (objectIterator.hasNext()) {
            val obj = objectIterator.next()
            if (obj.isShredding) {
                obj.size -= 5f * shredderSpeedFactor
                obj.alpha = (obj.alpha - (35 * shredderSpeedFactor).toInt()).coerceAtLeast(0)
                if (obj.size <= 0f || obj.alpha <= 0) {
                    objectIterator.remove()
                }
                continue
            }
            obj.y += obj.speed
            val objectRect = RectF(obj.x - obj.size / 2, obj.y - obj.size / 2, obj.x + obj.size / 2, obj.y + obj.size / 2)
            if (RectF.intersects(objectRect, shredderRect)) {
                sessionScore++
                obj.isShredding = true
                playSound(shredSoundId)
                playSound(coinSoundId) // Play coin sound
                generateParticles(obj.x, shredderRect.top + 5) // Particles from shredder top
            } else if (obj.y - obj.size / 2 > height) {
                objectIterator.remove()
            }
        }

        if (isGameRunning && currentTime - lastSpawnTime > spawnInterval) {
            spawnNewObject()
            lastSpawnTime = currentTime
        }

        val particleIterator = particles.iterator()
        while(particleIterator.hasNext()) {
            val particle = particleIterator.next()
            particle.x += particle.xSpeed
            particle.y += particle.ySpeed
            particle.ySpeed += particleGravity
            particle.alpha = (particle.alpha - (255 / (particleBaseLifetime / 2) ) ).coerceAtLeast(0) // Faster fade
            particle.lifetime--
            if (particle.lifetime <= 0 || particle.alpha <= 0) {
                particleIterator.remove()
            }
        }
    }

    private fun generateParticles(x: Float, y: Float) {
        val particleCount = 25 // More particles
        for (i in 0 until particleCount) {
            val angle = Random.nextDouble() * Math.PI // Emit upwards in a semicircle
            val speed = Random.nextFloat() * 6 + 3 // Speed between 3 and 9
            val xSpeed = (kotlin.math.cos(angle - Math.PI / 2) * speed).toFloat() // Centered upwards
            val ySpeed = (-kotlin.math.sin(angle) * speed).toFloat() // Ensure initial upward motion

            particles.add(
                Particle(
                    x = x + (Random.nextFloat() - 0.5f) * 50f, // Spread horizontally a bit
                    y = y,
                    color = Particle.RAINBOW_COLORS.random(),
                    radius = Random.nextFloat() * 6 + 4f, // size 4 to 10
                    xSpeed = xSpeed,
                    ySpeed = ySpeed,
                    lifetime = (particleBaseLifetime + Random.nextInt(-10, 10)) // Vary lifetime a bit
                )
            )
        }
    }

    private fun spawnNewObject() {
        val randomType = ObjectType.values().random()
        val randomX = Random.nextFloat() * width
        val randomSize = Random.nextFloat() * 50f + 30f
        val randomSpeed = Random.nextFloat() * 5f + 5f

        objects.add(
            FallingObject(
                x = randomX,
                y = -randomSize,
                type = randomType,
                size = randomSize,
                speed = randomSpeed
            )
        )
    }

    private fun playSound(soundId: Int) {
        if (soundId > 0) { // Check if soundId is loaded
            soundPool?.play(soundId, 0.5f, 0.5f, 1, 0, 1f) // Reduced volume slightly
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawColor(Color.parseColor("#FFFDE7")) // Background from colors.xml

        canvas.drawRect(shredderRect, shredderPaint)

        for (obj in objects) {
            objectPaint.alpha = obj.alpha
            val halfSize = obj.size / 2
            when (obj.type) {
                ObjectType.TOY -> {
                    objectPaint.color = when(currentSelectedSkinId) {
                        "blue_toy" -> Color.CYAN // Example: Blue Toy skin makes toys cyan
                        else -> Color.parseColor("#4FC3F7") // Default Light Blue
                    }
                    val rect = RectF(obj.x - halfSize, obj.y - halfSize, obj.x + halfSize, obj.y + halfSize)
                    canvas.drawRoundRect(rect, obj.size / 4, obj.size / 4, objectPaint)
                }
                ObjectType.FRUIT -> {
                    objectPaint.color = Color.parseColor("#AED581") // Default Light Green
                    // Add skin logic for FRUIT if any
                    canvas.drawCircle(obj.x, obj.y, halfSize, objectPaint)
                }
                ObjectType.BLOCK -> {
                     objectPaint.color = when(currentSelectedSkinId) {
                        "red_block" -> Color.MAGENTA // Example: Red Block skin makes blocks magenta
                        else -> Color.parseColor("#FF8A80") // Default Light Red
                    }
                    canvas.drawRect(obj.x - halfSize, obj.y - halfSize, obj.x + halfSize, obj.y + halfSize, objectPaint)
                }
            }
        }

        for (particle in particles) {
            particlePaint.color = particle.color
            particlePaint.alpha = particle.alpha
            val particleHalfSize = particle.radius / 2
            canvas.drawRect( // Draw as small squares for confetti
                particle.x - particleHalfSize,
                particle.y - particleHalfSize,
                particle.x + particleHalfSize,
                particle.y + particleHalfSize,
                particlePaint
            )
        }
    }
}
