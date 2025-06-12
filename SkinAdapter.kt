package com.example.myapp.presentation.ui

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.myapp.R
import com.example.myapp.domain.model.Skin

class SkinAdapter(
    private val onUnlockClicked: (skin: Skin) -> Unit,
    private val onSelectClicked: (skin: Skin) -> Unit
) : ListAdapter<Skin, SkinAdapter.SkinViewHolder>(SkinDiffCallback()) {

    private var currentCoins: Int = 0
    private var selectedSkinId: String? = null

    fun setCurrentCoins(coins: Int) {
        currentCoins = coins
        // notifyDataSetChanged() // Could be inefficient, better to handle in bind or use payloads
    }

    fun setSelectedSkinId(skinId: String?) {
        selectedSkinId = skinId
        notifyDataSetChanged() // Necessary to update selection highlights
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SkinViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_skin, parent, false) // item_skin.xml needs to be created
        return SkinViewHolder(view)
    }

    override fun onBindViewHolder(holder: SkinViewHolder, position: Int) {
        val item = getItem(position)
        holder.bind(item, currentCoins, selectedSkinId == item.id, onUnlockClicked, onSelectClicked)
    }

    class SkinViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val nameTextView: TextView = itemView.findViewById(R.id.skinNameTextView)
        private val iconImageView: ImageView = itemView.findViewById(R.id.skinIconImageView)
        private val actionButton: Button = itemView.findViewById(R.id.skinActionButton)
        private val itemLayout: View = itemView // For background tinting if selected

        fun bind(
            skin: Skin,
            currentCoins: Int,
            isSelected: Boolean,
            onUnlockClicked: (skin: Skin) -> Unit,
            onSelectClicked: (skin: Skin) -> Unit
        ) {
            nameTextView.text = skin.name
            iconImageView.setImageResource(skin.iconResId) // Placeholder icons

            if (isSelected) {
                itemLayout.setBackgroundColor(Color.LTGRAY) // Highlight selected
                actionButton.text = "Selected"
                actionButton.isEnabled = false
            } else {
                itemLayout.setBackgroundColor(Color.TRANSPARENT) // Default background
                if (skin.isUnlocked) {
                    actionButton.text = "Select"
                    actionButton.isEnabled = true
                    actionButton.setOnClickListener { onSelectClicked(skin) }
                } else {
                    actionButton.text = "Unlock (${skin.unlockCost})"
                    actionButton.isEnabled = currentCoins >= skin.unlockCost
                    actionButton.setOnClickListener { onUnlockClicked(skin) }
                }
            }
        }
    }

    class SkinDiffCallback : DiffUtil.ItemCallback<Skin>() {
        override fun areItemsTheSame(oldItem: Skin, newItem: Skin): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Skin, newItem: Skin): Boolean {
            return oldItem == newItem
        }
    }
}
