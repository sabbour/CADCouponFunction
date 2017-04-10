var Jimp = require("jimp");
var path = require("path");
var azure = require('azure-storage');
var util = require("util");
var name;

module.exports = function (context, req) {
 
        var input = req;
        context.log("Contents of req " + util.inspect(input, {showHidden: false, depth: null}));    
        name = req.body.name;
        // Log incoming request:
        context.log('Got a request to create coupon for ' +  ' for name : ' + name );

    // Determine where base image is:
        var baseImgPath = path.resolve(__dirname, 'Christmas-Coupon-Template-1.jpeg');
        context.log('base image path: ' + baseImgPath);

        // Read image with Jimp
        Jimp.read(baseImgPath).then((image) => {
            context.log('got base coupon to start from');

            try
            {

                Jimp.loadFont(Jimp.FONT_SANS_16_BLACK).then(function (font) {
                    context.log('Loaded font for writing on image.');

                    // Write score on image:
                    image.print(font, 60, 150, "Dear name: " + name + ".Your discount is " + " 15 %");

                    Jimp.loadFont(Jimp.FONT_SANS_8_BLACK).then(function (font) {
                        // Write attemptid on image:
                //        image.print(font, 50, 150, "Attempt: " + "some text here");

                        // Manipulate image
                        image.getBuffer(Jimp.MIME_JPEG, (error, stream) => {
                            context.log('Successfully processed the image name ' + name);

                            var blobLocation = generateSasToken(context, 'coupons', name + '.jpg', 'r').uri;
                            context.log('Coupon to be stored here: ' + blobLocation);

                            // Return url to storage:
                            context.res = {
                                body: { couponUrl: blobLocation }
                            };

                            // Bind the stream to the output binding to create a new blob
                            context.done(null, { outputBlob: stream });
                            context.log(': ' + blobLocation);
                        });
                    });

                    // Check for errors
                    if (error) {
                        context.log(`There was an error processing the image.`);
                        context.done(error);
                    }
                });
            }
            catch(e)
            {
                context.log(e.message);
            }
    
        });
    

   function generateSasToken(context, container, blobName, permissions) {
       
       try
       {

            var connString = process.env.AzureWebJobsStorage;
            var blobService = azure.createBlobService(connString);

            // Create a SAS token that expires in an hour
            // Set start time to five minutes ago to avoid clock skew.
            var startDate = new Date();
            startDate.setMinutes(startDate.getMinutes() - 5);
            var expiryDate = new Date(startDate);
            expiryDate.setMinutes(startDate.getMinutes() + 60);

            permissions = permissions || azure.BlobUtilities.SharedAccessPermissions.READ;

            var sharedAccessPolicy = {
                AccessPolicy: {
                    Permissions: permissions,
                    Start: startDate,
                    Expiry: expiryDate
                }
            };

            var sasToken = blobService.generateSharedAccessSignature(container, blobName, sharedAccessPolicy);

            return {
                token: sasToken,
                uri: blobService.getUrl(container, blobName, sasToken, true)
            };

       }
       catch(e)
       {
           context.log(e.message);
       }
     }

};
