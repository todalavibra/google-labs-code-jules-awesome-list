package com.example.myapp.presentation.ui

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
import com.example.myapp.domain.model.UpgradeItem

class UpgradeAdapter(
    private val onUpgradeClicked: (upgradeItem: UpgradeItem) -> Unit,
    private val onUnlockAdClicked: (upgradeItem: UpgradeItem) -> Unit
) : ListAdapter<UpgradeItem, UpgradeAdapter.UpgradeViewHolder>(UpgradeDiffCallback()) {

    private var currentCoins: Int = 0

    fun setCurrentCoins(coins: Int) {
        currentCoins = coins
        // No need to call notifyDataSetChanged() here if only button enable/disable state changes,
        // which can be handled in onBindViewHolder. If item content itself changes due to coins,
        // then submitting the list again or specific notifyItemChanged calls would be needed.
        // For simplicity, we might re-bind or rely on view holder updates.
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UpgradeViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_upgrade, parent, false) // item_upgrade.xml needs to be created
        return UpgradeViewHolder(view)
    }

    override fun onBindViewHolder(holder: UpgradeViewHolder, position: Int) {
        val item = getItem(position)
        holder.bind(item, currentCoins, onUpgradeClicked, onUnlockAdClicked)
    }

    class UpgradeViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val nameTextView: TextView = itemView.findViewById(R.id.upgradeNameTextView)
        private val descriptionTextView: TextView = itemView.findViewById(R.id.upgradeDescriptionTextView)
        private val levelTextView: TextView = itemView.findViewById(R.id.upgradeLevelTextView)
        private val iconImageView: ImageView = itemView.findViewById(R.id.upgradeIconImageView)
        private val actionButton: Button = itemView.findViewById(R.id.upgradeActionButton)

        fun bind(
            item: UpgradeItem,
            currentCoins: Int,
            onUpgradeClicked: (upgradeItem: UpgradeItem) -> Unit,
            onUnlockAdClicked: (upgradeItem: UpgradeItem) -> Unit
        ) {
            nameTextView.text = item.name
            descriptionTextView.text = item.description
            iconImageView.setImageResource(item.iconResId) // Actual icons needed

            if (item.isUnlockedByAd) {
                if (item.isAdUnlocked) {
                    levelTextView.text = "Unlocked"
                    actionButton.text = "Active"
                    actionButton.isEnabled = false
                } else {
                    levelTextView.text = "Unlock via Ad"
                    actionButton.text = "Watch Ad"
                    actionButton.isEnabled = true
                    actionButton.setOnClickListener { onUnlockAdClicked(item) }
                }
            } else {
                levelTextView.text = "Level: ${item.currentLevel}/${item.maxLevel}"
                if (item.isMaxLevel()) {
                    actionButton.text = "Max Level"
                    actionButton.isEnabled = false
                } else {
                    val cost = item.getNextLevelCost()
                    actionButton.text = "Cost: $cost"
                    actionButton.isEnabled = cost != null && currentCoins >= cost
                    actionButton.setOnClickListener { onUpgradeClicked(item) }
                }
            }
        }
    }

    class UpgradeDiffCallback : DiffUtil.ItemCallback<UpgradeItem>() {
        override fun areItemsTheSame(oldItem: UpgradeItem, newItem: UpgradeItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: UpgradeItem, newItem: UpgradeItem): Boolean {
            return oldItem == newItem // Relies on UpgradeItem being a data class
        }
    }
}
