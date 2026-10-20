package com.hana.shop;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class NotificationReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (NotificationScheduler.BIRTHDAY.equals(action)) {
            NotificationScheduler.notifyBirthdays(context);
            NotificationScheduler.scheduleBirthdays(context);
        } else if (NotificationScheduler.TASK.equals(action)) {
            NotificationScheduler.notifyTask(context, intent.getStringExtra("id"));
        }
    }
}
