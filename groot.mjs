#!/usr/bin/env node

import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { get } from "https";
import { diffLines } from "diff";
import chalk from "chalk";
import { Command } from "commander";

const program = new Command();

class Groot {
	constructor(repoPath = ".") {
		this.repoPath = path.join(repoPath, ".groot"); // this will create .groot folder
		this.objectsPath = path.join(this.repoPath, "objects"); //it will create groot/objects folder
		this.headPath = path.join(this.repoPath, "HEAD"); // groot/HEAD
		this.indexPath = path.join(this.repoPath, "index");
		this.init();
	}

	async init() {
		await fs.mkdir(this.objectsPath, { recursive: true });
		try {
			await fs.writeFile(this.headPath, "", { flag: "wx" }); // wx -> means open for writing and fails if file exist

			await fs.writeFile(this.indexPath, JSON.stringify([]), { flag: "wx" });
		} catch (error) {
			console.log("Already initialized the .groot folder");
		}
	}

	hashObject(content) {
		return crypto.createHash("sha1").update(content, "utf-8").digest("hex");
	}

	async add(fileToBeAdded) {
		const fileData = await fs.readFile(fileToBeAdded, { encoding: "utf-8" });
		const fileHash = this.hashObject(fileData);
		console.log(fileHash);
		const newFileHashedObjectPath = path.join(this.objectsPath, fileHash);
		await fs.writeFile(newFileHashedObjectPath, fileData);
		// TODO: Add the file to staging area
		await this.updateStagingArea(fileToBeAdded, fileHash);
		console.log(`Added ${fileToBeAdded}`);
	}

	async updateStagingArea(filePath, fileHash) {
		const index = JSON.parse(
			await fs.readFile(this.indexPath, { encoding: "utf-8" })
		);
		index.push({ path: filePath, hash: fileHash });

		await fs.writeFile(this.indexPath, JSON.stringify(index));
	}

	async commit(message) {
		const index = JSON.parse(
			await fs.readFile(this.indexPath, { encoding: "utf-8" })
		);
		const parentCommit = await this.getCurrentHead();

		const commitData = {
			timeStamp: new Date().toISOString(),
			message: message,
			files: index,
			parent: parentCommit,
		};

		const commitHash = this.hashObject(JSON.stringify(commitData));
		const commitPath = path.join(this.objectsPath, commitHash);
		await fs.writeFile(commitPath, JSON.stringify(commitData));
		await fs.writeFile(this.headPath, commitHash); // update the HEAD to point on the new commit
		await fs.writeFile(this.indexPath, JSON.stringify([])); // clear the staging area
		console.log(`Commit Successfully created: ${commitHash}`);
	}
	async getCurrentHead() {
		try {
			return await fs.readFile(this.headPath, { encoding: "utf-8" });
		} catch (error) {
			return null;
		}
	}

	async log() {
		let currentCommitHash = await this.getCurrentHead();
		while (currentCommitHash) {
			const commitData = JSON.parse(
				await fs.readFile(path.join(this.objectsPath, currentCommitHash), {
					encoding: "utf-8",
				})
			);
			console.log("--------------\n");
			console.log(
				`Commit: ${currentCommitHash}\n Date: ${commitData.timeStamp}\n${commitData.message}\n`
			);
			currentCommitHash = commitData.parent;
		}
	}

	async showCommitDiff(commitHash) {
		const commitData = JSON.parse(await this.getCommitData(commitHash));
		if (!commitData) {
			console.log("Commit not found");
			return;
		}

		console.log("Changes in the last commit: :\n");
		for (const file of commitData.files) {
			console.log(`File: ${file.path}`);
			const fileContent = await this.getFileContent(file.hash);
			console.log(fileContent);
			if (commitData.parent) {
				// get the parent commit data
				const parentCommitData = JSON.parse(
					await this.getCommitData(commitData.parent)
				);

				const getParentFileContent = await this.getParentFileContent(
					parentCommitData,
					file.path
				);

				if (getParentFileContent != undefined) {
					console.log("\nDiff:");
					const diff = diffLines(getParentFileContent, fileContent);

					// console.log(diff);
					diff.forEach((part) => {
						if (part.added) {
							process.stdout.write("++" + chalk.green(part.value));
						} else if (part.removed) {
							process.stdout.write("--" + chalk.red(part.value));
						} else {
							process.stdout.write(chalk.grey(part.value));
						}
					});
					console.log();
				} else {
					console.log("New file in this commit");
				}
			} else {
				console.log("First Commit");
			}
		}
	}
	async getParentFileContent(parentCommitData, filePath) {
		const parentFile = parentCommitData.files.find(
			(file) => filePath === filePath
		);

		if (parentFile) {
			return await this.getFileContent(parentFile.hash);
		}
	}
	async getCommitData(commitHash) {
		const commitPath = path.join(this.objectsPath, commitHash);
		try {
			return await fs.readFile(commitPath, { encoding: "utf-8" });
		} catch (error) {
			console.log("Failed to read the commit data", error);
			return null;
		}
	}

	async getFileContent(fileHash) {
		const objectPath = path.join(this.objectsPath, fileHash);
		return await fs.readFile(objectPath, { encoding: "utf-8" });
	}
}

// (async () => {
// 	const groot = new Groot();
// 	// await groot.add("./sample.txt");
// 	// await groot.commit("4th commit");
// 	// await groot.log();
// 	await groot.showCommitDiff("6e4d1d9c4a2cfb06117a164a2f5f9eefd3faf23e");
// })();

program.command("init").action(async () => {
	const groot = new Groot();
});

program.command("add <file>").action(async (file) => {
	const groot = new Groot();
	await groot.add(file);
});

program.command("commit <message>").action(async (message) => {
	const groot = new Groot();
	await groot.commit(message);
});

program.command("log").action(async () => {
	const groot = new Groot();
	await groot.log();
});

program.command("show <commitHash>").action(async (commitHash) => {
	const groot = new Groot();
	await groot.showCommitDiff(commitHash);
});

program.parse(process.argv);
