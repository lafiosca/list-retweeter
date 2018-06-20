# list-retweeter

This is a Twitter bot for consolidating content from a network of accounts.
The bot runs every 15 minutes, looking at all recent tweets from members of
the configured list. It will retweet and like all original (non-reply,
non-retweet) tweets that it has not already.

## Deployment

1. Install and configure the AWS CLI, npm, and git.
2. Clone this repository.
3. Create a Twitter application and authorize it as the user you want to tweet with, recording the credentials. You may follow the application creation steps in [one of the various Twitter bot tutorials](https://venturebeat.com/2017/02/02/how-to-build-your-own-twitter-bot-in-less-than-30-minutes/).
4. As the same user who authorized the application, create a private [Twitter list](https://help.twitter.com/en/using-twitter/twitter-lists) with at least one member, and record the list slug (the name for the list that appears in the URL when you view it).
5. Copy `config.sh.example` to `config.sh` and replace the required values:
    * `S3BucketArtifacts`: the name of an S3 bucket you have write access to. This is where your code artifacts will be stored during deployment.
    * `S3PrefixArtifacts`: the prefix within that S3 bucket for storing the code artifacts (default: "cloudformation/list-retweeter")
    * `StackName`: the name of the AWS CloudFormation stack to create during deployment (default: "ListRetweeter")
    * `TwitterConsumerKey`: the consumer key for your Twitter application
    * `TwitterConsumerSecret`: the consumer secret for your Twitter application
    * `TwitterAccessToken`: the access token for the user who has authorized your Twitter application
    * `TwitterAccessTokenSecret`: the access token secret for the user who has authorized your Twitter application
    * `TwitterListSlug`: the list slug of that user's private Twitter list
6. Run `./package.sh` to package and deploy the bot to AWS.

If all goes well, at this point you are done. If you log into the AWS console,
you should find a CloudFormation stack named `ListRetweeter` (or whatever you
changed the `StackName` to in `config.sh`). This stack should contain a Lambda
function named `<StackName>-ListRetweeter` which will run every 15 minutes,
retweeting and liking every original status from the members of your list. You
can look at the CloudWatch logs of the Lambda function for troubleshooting.

