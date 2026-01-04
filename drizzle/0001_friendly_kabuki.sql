CREATE TABLE `feishu_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appId` varchar(128) NOT NULL,
	`appSecret` varchar(256) NOT NULL,
	`appToken` varchar(128) NOT NULL,
	`tableId` varchar(128) NOT NULL,
	`imageFieldName` varchar(128) DEFAULT '封面图片',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feishu_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','exporting','uploading','completed','failed') NOT NULL DEFAULT 'pending',
	`totalRecords` int DEFAULT 0,
	`processedRecords` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
